import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getDatabase } from "@/db";
import { GamesId, UsersId, WordsId } from "@/db/models";
import { maskUserId } from "@/server/mask";
import { authProcedure } from "@/server/procedures";
import { gameIdSchema } from "@/server/validation";
import { PusherMapping } from "@/types/pusher";

const sortByKey = <T extends Record<string, unknown>>(object: T): T =>
	Object.fromEntries(
		Object.entries(object).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)),
	) as T;

type TeamMapping = Record<
	UsersId,
	{ vote: UsersId | null; definition: string }
>;

export const getRevealMap = (
	gameId: GamesId,
	ownerId: UsersId,
	wordId: WordsId,
	teamMapping: TeamMapping,
): PusherMapping["guessing:reveal"]["mapping"] =>
	Object.entries(teamMapping).reduce<
		PusherMapping["guessing:reveal"]["mapping"]
	>(
		(acc, [teamId, { vote }]) => {
			if (!vote) {
				throw new Error(
					`Expected to have a vote from user "${teamId}" at revealed time`,
				);
			}
			return {
				...acc,
				[maskUserId(teamId, gameId, wordId)]: {
					id: teamId,
					vote: vote === ownerId ? null : vote,
				},
			};
		},
		{ [maskUserId(ownerId, gameId, wordId)]: null },
	);

export const getPackedResults = <
	T extends {
		wordId: WordsId;
		teamId: UsersId;
	},
	D,
	TD,
>(
	results: T[],
	getData: (result: T) => D,
	getTeamData: (result: T) => TD,
): Record<WordsId, D & { teamMapping: Record<UsersId, TD> }> =>
	results.reduce<Record<WordsId, D & { teamMapping: Record<UsersId, TD> }>>(
		(acc, result) => {
			const teamData = getTeamData(result);
			return {
				...acc,
				[result.wordId]: acc[result.wordId]
					? {
							...acc[result.wordId],
							teamMapping: {
								...acc[result.wordId].teamMapping,
								[result.teamId]: teamData,
							},
					  }
					: {
							...getData(result),
							teamMapping: { [result.teamId]: teamData },
					  },
			};
		},
		{},
	);

export const procedure = authProcedure
	.input(z.object({ gameId: gameIdSchema }))
	.query(async ({ input, ctx }) => {
		const db = getDatabase();
		const results = await db
			.selectFrom("words")
			.where("words.gameId", "=", input.gameId)
			.innerJoin("definitions", (qb) =>
				qb.onRef("words.id", "=", "definitions.wordId"),
			)
			.innerJoin("games", (qb) => qb.onRef("games.id", "=", "words.gameId"))
			.select([
				"games.ownerId as ownerId",
				"words.id as wordId",
				"words.definition as realDefinition",
				"definitions.userId as teamId",
				"definitions.definition",
				"definitions.guessUserId",
				"words.revealed",
			])
			.execute();
		if (results.length === 0) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "Game does not exist",
			});
		}
		if (!results.some(({ teamId }) => teamId === ctx.auth.userId)) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "You don't participate in this game",
			});
		}

		const packedResults = getPackedResults(
			results,
			({ ownerId, revealed, realDefinition }) => ({
				ownerId,
				revealed,
				realDefinition,
			}),
			({ guessUserId, definition, wordId, teamId }) => {
				if (!definition) {
					throw new Error(
						`Expected to have definition for team "${teamId}" at word "${wordId}" at guessing phase`,
					);
				}
				return { vote: guessUserId, definition };
			},
		);
		return Object.entries(packedResults).reduce<
			Record<
				WordsId,
				{
					definitions: Record<string, string>;
					vote: string | null;
					readiness: Record<UsersId, boolean>;
					revealMap: PusherMapping["guessing:reveal"]["mapping"] | null;
				}
			>
		>((acc, [wordId, { ownerId, realDefinition, teamMapping, revealed }]) => {
			const selfVote = teamMapping[ctx.auth.userId].vote;
			return {
				...acc,
				[wordId]: {
					definitions: sortByKey(
						Object.entries(teamMapping).reduce(
							(subacc, [teamId, { definition }]) =>
								teamId === ctx.auth.userId
									? subacc
									: {
											...subacc,
											[maskUserId(teamId, input.gameId, wordId)]: definition,
									  },
							{ [maskUserId(ownerId, input.gameId, wordId)]: realDefinition },
						),
					),
					vote: selfVote ? maskUserId(selfVote, input.gameId, wordId) : null,
					readiness: Object.entries(teamMapping).reduce(
						(subacc, [teamId, { vote }]) => ({
							...subacc,
							[teamId]: Boolean(vote),
						}),
						{},
					),
					revealMap: revealed
						? getRevealMap(input.gameId, ownerId, wordId, teamMapping)
						: null,
				},
			};
		}, {});
	});
