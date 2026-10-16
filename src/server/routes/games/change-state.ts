import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDatabase } from "~/db";
import type { Game } from "~/hooks/use-game";
import { getEmitter } from "~/server/emitter";
import { authProcedure } from "~/server/procedures";
import { gameIdSchema } from "~/server/validation";

const getNextState = (
	input: { direction: "forward" | "backward" },
	game: {
		state: Game["state"];
		firstWordPosition: number;
		lastWordPosition: number;
	},
) => {
	switch (input.direction) {
		case "forward": {
			switch (game.state.phase) {
				case "start": {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Game should be started via game.start handler",
					});
				}
				case "proposal": {
					return {
						currentPosition: game.firstWordPosition,
						phase: "guessing",
					} as const;
				}
				case "guessing": {
					return { phase: "finish" } as const;
				}
				case "finish": {
					throw new TRPCError({
						code: "PRECONDITION_FAILED",
						message: "Game cannot be forwarded from 'finish' state",
					});
				}
			}
		}
		// This is unreachable, we don't track nested switch statements
		// oxlint-disable-next-line no-fallthrough
		case "backward": {
			switch (game.state.phase) {
				case "start": {
					throw new TRPCError({
						code: "PRECONDITION_FAILED",
						message: "Game cannot be backwarded from 'start' state",
					});
				}
				case "proposal": {
					return { phase: "start" } as const;
				}
				case "guessing": {
					return {
						currentPosition: game.lastWordPosition,
						phase: "proposal",
					} as const;
				}
				case "finish": {
					return {
						currentPosition: game.lastWordPosition,
						phase: "guessing",
					} as const;
				}
			}
		}
	}
};

export const procedure = authProcedure
	.input(
		z.object({
			direction: z.union([z.literal("forward"), z.literal("backward")]),
			id: gameIdSchema,
		}),
	)
	.mutation(async ({ ctx, input }) => {
		const db = getDatabase();
		const game = await db
			.selectFrom("games")
			.leftJoin("words", (qb) => qb.onRef("games.id", "=", "words.gameId"))
			.leftJoin("teams", (qb) => qb.onRef("games.id", "=", "teams.gameId"))
			.where("games.id", "=", input.id)
			.where("games.ownerId", "=", ctx.auth.userId)
			.select([
				"games.ownerId",
				"games.state",
				db.fn.max("words.position").as("lastWordPosition"),
				db.fn.min("words.position").as("firstWordPosition"),
				db.fn.count("words.id").as("wordsAmount"),
				db.fn.count("teams.userId").as("teamsAmount"),
			])
			.groupBy(["games.ownerId", "games.state"])
			.executeTakeFirst();
		if (!game) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "Game not found or you are not the game owner",
			});
		}
		const nextState = getNextState(input, game);
		await db
			.updateTable("games")
			.where("games.id", "=", input.id)
			.set({ state: nextState })
			.executeTakeFirst();
		const emitter = getEmitter(ctx, input.id);
		emitter.trigger("game:state", { state: nextState });
	});
