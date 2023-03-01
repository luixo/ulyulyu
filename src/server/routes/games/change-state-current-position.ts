import { TRPCError } from "@trpc/server";
import { sql } from "kysely";
import { z } from "zod";

import { getDatabase } from "@/db";
import { authProcedure } from "@/server/procedures";
import { getPusher } from "@/server/pusher";
import { gameIdSchema } from "@/server/validation";

export const procedure = authProcedure
	.input(
		z.object({
			id: gameIdSchema,
			direction: z.union([z.literal("forward"), z.literal("backward")]),
		}),
	)
	.mutation(async ({ ctx, input }) => {
		const db = getDatabase();
		const game = await db
			.selectFrom("games")
			.leftJoin("words", (qb) => qb.onRef("games.id", "=", "words.gameId"))
			.where("games.id", "=", input.id)
			.where("games.ownerId", "=", ctx.auth.userId)
			.$if(input.direction === "forward", (qb) =>
				qb.whereRef(
					"words.position",
					">",
					sql`games.state->>'position'`.$castTo<number>(),
				),
			)
			.$if(input.direction === "backward", (qb) =>
				qb.whereRef(
					"words.position",
					">",
					sql`games.state->>'position'`.$castTo<number>(),
				),
			)
			.select([
				"games.ownerId",
				"games.state",
				input.direction === "forward"
					? db.fn.min("words.position").as("nextPosition")
					: db.fn.max("words.position").as("nextPosition"),
			])
			.groupBy(["games.ownerId", "games.state"])
			.executeTakeFirst();
		if (!game) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "Game not found or you are not a game owner",
			});
		}
		if (game.state.phase !== "guessing" && game.state.phase !== "proposal") {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "Game must be in either proposal or guessing phase",
			});
		}
		await db
			.updateTable("games")
			.where("games.id", "=", input.id)
			.set({
				state: {
					...game.state,
					currentPosition: game.nextPosition,
				},
			})
			.executeTakeFirst();
		const pusher = getPusher(ctx, input.id);
		pusher.trigger("game:currentPosition", {
			currentPosition: game.nextPosition,
		});
	});
