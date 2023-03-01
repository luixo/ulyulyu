import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getDatabase } from "@/db";
import { UsersId, WordsId } from "@/db/models";
import { authProcedure } from "@/server/procedures";
import { gameIdSchema } from "@/server/validation";

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
			.leftJoin("definitions", (qb) =>
				qb
					.onRef("definitions.wordId", "=", "words.id")
					.onRef("definitions.userId", "=", "teams.userId"),
			)
			.select(["words.id as wordId", "teams.userId", "definitions.definition"])
			.execute();
		if (results.length === 0) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "Game does not exist or you are not the owner",
			});
		}

		return results.reduce<Record<WordsId, Record<UsersId, boolean>>>(
			(acc, { wordId, userId, definition }) => ({
				...acc,
				[wordId]: {
					...acc[wordId],
					[userId]: Boolean(definition),
				},
			}),
			{},
		);
	});
