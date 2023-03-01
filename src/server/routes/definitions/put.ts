import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getDatabase } from "@/db";
import { DEFINITIONS } from "@/db/contants";
import { authProcedure } from "@/server/procedures";
import { getPusher } from "@/server/pusher";
import {
	definitionSchema,
	gameIdSchema,
	wordIdSchema,
} from "@/server/validation";

export const procedure = authProcedure
	.input(
		z.strictObject({
			gameId: gameIdSchema,
			wordId: wordIdSchema,
			definition: definitionSchema.nullable(),
		}),
	)
	.mutation(async ({ ctx, input }) => {
		const db = getDatabase();
		const game = await db
			.selectFrom("games")
			.innerJoin("words", (qb) =>
				qb
					.onRef("words.gameId", "=", "games.id")
					.on("words.id", "=", input.wordId),
			)
			.innerJoin("teams", (qb) =>
				qb
					.onRef("teams.gameId", "=", "games.id")
					.on("teams.userId", "=", ctx.auth.userId),
			)
			.where("games.id", "=", input.gameId)
			.select(["games.state as gameState"])
			.executeTakeFirst();
		if (!game) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message:
					"Game not found or you don't participate in a game or word doesn't exist",
			});
		}
		if (game.gameState.phase !== "proposal") {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "Game is not on the proposal state",
			});
		}
		const prevValue = await db
			.selectFrom("definitions")
			.where("definitions.wordId", "=", input.wordId)
			.where("definitions.userId", "=", ctx.auth.userId)
			.select("definitions.definition")
			.executeTakeFirst();
		await db
			.insertInto("definitions")
			.values({
				definition: input.definition,
				wordId: input.wordId,
				userId: ctx.auth.userId,
			})
			.onConflict((oc) =>
				oc
					.constraint(DEFINITIONS.CONSTRAINTS.WORD_ID__USER_ID)
					.doUpdateSet({
						definition: (eb) => eb.ref("excluded.definition"),
					})
					.where("definitions.wordId", "=", input.wordId)
					.where("definitions.userId", "=", ctx.auth.userId),
			)
			.executeTakeFirst();
		const prevHasDefinition = Boolean(prevValue?.definition);
		const nextHasDefinition = Boolean(input.definition);
		if (prevHasDefinition !== nextHasDefinition) {
			const pusher = getPusher(ctx, input.gameId);
			pusher.trigger("definition:ready", {
				teamId: ctx.auth.userId,
				wordId: input.wordId,
				ready: Boolean(input.definition),
			});
		}
	});
