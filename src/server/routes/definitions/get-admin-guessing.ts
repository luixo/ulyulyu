import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getDatabase } from "@/db";
import { UsersId, WordsId } from "@/db/models";
import { authProcedure } from "@/server/procedures";
import { gameIdSchema } from "@/server/validation";
import { PusherMapping } from "@/types/pusher";

import { getPackedResults, getRevealMap } from "./get-player-guessing";

export const procedure = authProcedure
	.input(z.object({ gameId: gameIdSchema }))
	.query(async ({ input, ctx }) => {
		const db = getDatabase();
		const results = await db
			.selectFrom("games")
			.where("games.id", "=", input.gameId)
			.where("games.ownerId", "=", ctx.auth.userId)
			.innerJoin("teams", (qb) => qb.onRef("teams.gameId", "=", "games.id"))
			.innerJoin("words", (qb) => qb.onRef("words.gameId", "=", "games.id"))
			.innerJoin("definitions", (qb) =>
				qb
					.onRef("definitions.wordId", "=", "words.id")
					.onRef("definitions.userId", "=", "teams.userId"),
			)
			.select([
				"words.id as wordId",
				"words.definition as originalDefinition",
				"words.revealed",
				"teams.userId as teamId",
				"definitions.definition",
				"definitions.guessUserId",
			])
			.execute();
		if (results.length === 0) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "Game does not exist or you're not the owner",
			});
		}
		const packedResults = getPackedResults(
			results,
			({ revealed, originalDefinition }) => ({ revealed, originalDefinition }),
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
					originalDefinition: string;
					definitions: Record<UsersId, string>;
					readiness: Record<UsersId, boolean>;
					revealMap: PusherMapping["guessing:reveal"]["mapping"] | null;
				}
			>
		>(
			(acc, [wordId, { originalDefinition, teamMapping, revealed }]) => ({
				...acc,
				[wordId]: {
					originalDefinition,
					definitions: Object.entries(teamMapping).reduce(
						(subacc, [teamId, { definition }]) => ({
							...subacc,
							[teamId]: definition,
						}),
						{},
					),
					readiness: Object.entries(teamMapping).reduce(
						(subacc, [teamId, { vote }]) => ({
							...subacc,
							[teamId]: Boolean(vote),
						}),
						{},
					),
					revealMap: revealed
						? getRevealMap(input.gameId, ctx.auth.userId, wordId, teamMapping)
						: null,
				},
			}),
			{},
		);
	});
