import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getDatabase } from "@/db";
import { authProcedure } from "@/server/procedures";
import { getPusher } from "@/server/pusher";
import { wordIdSchema, termSchema } from "@/server/validation";

export const procedure = authProcedure
	.input(
		z.strictObject({
			wordId: wordIdSchema,
			term: termSchema,
		}),
	)
	.mutation(async ({ ctx, input }) => {
		const db = getDatabase();
		const gameWord = await db
			.selectFrom("words")
			.innerJoin("games", (qb) => qb.onRef("games.id", "=", "words.gameId"))
			.where("words.id", "=", input.wordId)
			.where("games.ownerId", "=", ctx.auth.userId)
			.select(["games.id as gameId", "games.state as gameState"])
			.executeTakeFirst();
		if (!gameWord) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "Game not found or you are not the owner of the game",
			});
		}
		if (gameWord.gameState.phase !== "start") {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "Terms can only be changed on start phase",
			});
		}
		await db
			.updateTable("words")
			.set({ term: input.term })
			.where("words.id", "=", input.wordId)
			.executeTakeFirst();
		const pusher = getPusher(ctx, gameWord.gameId);
		pusher.trigger("word:term-update", {
			wordId: input.wordId,
			term: input.term,
		});
	});
