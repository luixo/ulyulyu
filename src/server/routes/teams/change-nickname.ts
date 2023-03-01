import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getDatabase } from "@/db";
import { authProcedure } from "@/server/procedures";
import { getPusher } from "@/server/pusher";
import { gameIdSchema, teamNicknameSchema } from "@/server/validation";

export const procedure = authProcedure
	.input(z.object({ gameId: gameIdSchema, nickname: teamNicknameSchema }))
	.mutation(async ({ ctx, input }) => {
		const db = getDatabase();
		const gameTeam = await db
			.selectFrom("games")
			.innerJoin("teams", (qb) => qb.onRef("games.id", "=", "teams.gameId"))
			.where("games.id", "=", input.gameId)
			.where("teams.userId", "=", ctx.auth.userId)
			.select(["games.state as gameState"])
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
				message: "Team nickname can only be changed in start phase",
			});
		}
		await db
			.updateTable("teams")
			.where("gameId", "=", input.gameId)
			.where("userId", "=", ctx.auth.userId)
			.set({ nickname: input.nickname })
			.executeTakeFirst();
		const pusher = getPusher(ctx, input.gameId);
		pusher.trigger("team:nickname", {
			userId: ctx.auth.userId,
			nickname: input.nickname,
		});
	});
