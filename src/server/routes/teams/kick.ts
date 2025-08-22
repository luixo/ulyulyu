import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getDatabase } from "~/db";
import { getEmitter } from "~/server/emitter";
import { authProcedure } from "~/server/procedures";
import { gameIdSchema, userIdSchema } from "~/server/validation";

export const procedure = authProcedure
  .input(z.object({ gameId: gameIdSchema, teamId: userIdSchema }))
  .mutation(async ({ ctx, input }) => {
    const db = getDatabase();
    const game = await db
      .selectFrom("teams")
      .innerJoin("games", (qb) => qb.onRef("teams.gameId", "=", "games.id"))
      .where("games.id", "=", input.gameId)
      .where("games.ownerId", "=", ctx.auth.userId)
      .where("teams.userId", "=", input.teamId)
      .select("games.state as state")
      .executeTakeFirst();
    if (!game) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message:
          "Game not found or team does not participate in it or you are not the game owner",
      });
    }
    if (game.state.phase !== "start") {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Teams can only be kicked on start phase",
      });
    }
    await db
      .deleteFrom("teams")
      .where("teams.userId", "=", input.teamId)
      .where("teams.gameId", "=", input.gameId)
      .executeTakeFirst();
    const emitter = getEmitter(ctx, input.gameId);
    emitter.trigger("team:leave", { userId: input.teamId });
  });
