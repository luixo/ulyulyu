import { TRPCError } from "@trpc/server";
import { v4 } from "uuid";
import { z } from "zod";
import { getDatabase } from "~/db";
import { getEmitter } from "~/server/emitter";
import { authProcedure } from "~/server/procedures";
import {
	definitionSchema,
	gameIdSchema,
	termSchema,
} from "~/server/validation";
import type { WordId } from "~/server/validation";

export const procedure = authProcedure
	.input(
		z.strictObject({
			definition: definitionSchema,
			gameId: gameIdSchema,
			term: termSchema,
		}),
	)
	.mutation(async ({ ctx, input }) => {
		const db = getDatabase();
		const gameWord = await db
			.selectFrom("games")
			.leftJoin("words", (qb) => qb.onRef("words.gameId", "=", "games.id"))
			.where("games.id", "=", input.gameId)
			.where("games.ownerId", "=", ctx.auth.userId)
			.orderBy("words.position", "desc")
			.select([
				"games.state as gameState",
				"words.position as lastWordPosition",
			])
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
				message: "Words can be added only on start phase",
			});
		}
		const wordId = v4() as WordId;
		const wordPosition = (gameWord.lastWordPosition ?? -1) + 1;
		const word = await db
			.insertInto("words")
			.values({
				definition: input.definition,
				gameId: input.gameId,
				id: wordId,
				position: wordPosition,
				revealed: false,
				term: input.term,
			})
			.returning(["words.id", "words.position"])
			.executeTakeFirstOrThrow();
		const emitter = getEmitter(ctx, input.gameId);
		emitter.trigger("word:add", {
			// We don't disclose original definitions to player
			definition: "",
			id: wordId,
			position: word.position,
			term: input.term,
		});
		return { id: word.id, position: word.position };
	});
