import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getDatabase } from "@/db";
import { authProcedure } from "@/server/procedures";
import { getPusher } from "@/server/pusher";
import { gameIdSchema } from "@/server/validation";

export const procedure = authProcedure
	.input(z.object({ gameId: gameIdSchema }))
	.mutation(async ({ ctx, input }) => {
		const db = getDatabase();
		const gameTeam = await db
			.selectFrom("teams")
			.where("teams.userId", "=", ctx.auth.userId)
			.where("teams.gameId", "=", input.gameId)
			.innerJoin("games", (qb) => qb.onRef("games.id", "=", "teams.gameId"))
			.select("games.state as gameState")
			.executeTakeFirst();
		if (!gameTeam) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "Game not found or team does not participate in it",
			});
		}
		if (gameTeam.gameState.phase !== "start") {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "Teams can leave only on start phase",
			});
		}
		await db
			.deleteFrom("teams")
			.where("teams.userId", "=", ctx.auth.userId)
			.where("teams.gameId", "=", input.gameId)
			.executeTakeFirst();
		const pusher = getPusher(ctx, input.gameId);
		pusher.trigger("team:leave", { userId: ctx.auth.userId });
	});
