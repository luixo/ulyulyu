import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getDatabase } from "~/db";
import { getEmitter } from "~/server/emitter";
import { authProcedure } from "~/server/procedures";
import { gameIdSchema, teamNicknameSchema } from "~/server/validation";

export const procedure = authProcedure
  .input(z.object({ gameId: gameIdSchema, nickname: teamNicknameSchema }))
  .mutation(async ({ ctx, input }) => {
    const db = getDatabase();
    const gameTeam = await db
      .selectFrom("games")
      .leftJoin("teams", (qb) =>
        qb
          .onRef("games.id", "=", "teams.gameId")
          .on("teams.userId", "=", ctx.auth.userId),
      )
      .where("games.id", "=", input.gameId)
      .select(["games.state as gameState", "teams.userId"])
      .executeTakeFirst();
    if (!gameTeam) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Game not found",
      });
    }
    if (gameTeam.gameState.phase !== "start") {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Teams can only join on start phase",
      });
    }
    if (gameTeam.userId) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Team already participate in a game",
      });
    }
    await db
      .insertInto("teams")
      .values({
        userId: ctx.auth.userId,
        gameId: input.gameId,
        nickname: input.nickname,
        ready: false,
      })
      .executeTakeFirst();
    const emitter = getEmitter(ctx, input.gameId);
    emitter.trigger("team:join", {
      userId: ctx.auth.userId,
      nickname: input.nickname,
    });
  });
