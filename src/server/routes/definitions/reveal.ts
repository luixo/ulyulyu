import { z } from "zod";

import { getDatabase } from "@/db";
import { maskUserId } from "@/server/mask";
import { authProcedure } from "@/server/procedures";
import { getPusher } from "@/server/pusher";
import { gameIdSchema, wordIdSchema } from "@/server/validation";
import { PusherMapping } from "@/types/pusher";

export const procedure = authProcedure
	.input(z.object({ gameId: gameIdSchema, wordId: wordIdSchema }))
	.mutation(async ({ input, ctx }) => {
		const db = getDatabase();
		const results = await db
			.selectFrom("games")
			.where("games.id", "=", input.gameId)
			.where("games.ownerId", "=", ctx.auth.userId)
			.innerJoin("teams", (qb) => qb.onRef("teams.gameId", "=", "games.id"))
			.innerJoin("words", (qb) =>
				qb
					.onRef("words.gameId", "=", "games.id")
					.on("words.id", "=", input.wordId),
			)
			.leftJoin("definitions", (qb) =>
				qb
					.onRef("definitions.wordId", "=", "words.id")
					.onRef("definitions.userId", "=", "teams.userId"),
			)
			.select([
				"words.id as wordId",
				"teams.userId as teamId",
				"definitions.definition",
				"definitions.guessUserId",
			])
			.execute();
		await db
			.updateTable("words")
			.where("words.id", "=", input.wordId)
			.set({ revealed: true })
			.execute();
		const pusher = getPusher(ctx, input.gameId);
		pusher.trigger("guessing:reveal", {
			wordId: input.wordId,
			mapping: results.reduce<PusherMapping["guessing:reveal"]["mapping"]>(
				(acc, { teamId, guessUserId }) => {
					if (!guessUserId) {
						throw new Error(
							`Expected to have a vote for team "${teamId}" for word "${input.wordId}"`,
						);
					}
					const maskedTeamId = maskUserId(teamId, input.gameId, input.wordId);
					if (acc[maskedTeamId]) {
						return acc;
					}
					return {
						...acc,
						[maskedTeamId]: {
							id: teamId,
							vote: guessUserId,
						},
					};
				},
				{
					[maskUserId(ctx.auth.userId, input.gameId, input.wordId)]: null,
				},
			),
		});
	});
