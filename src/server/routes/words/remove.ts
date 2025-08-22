import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getDatabase } from "~/db";
import { getEmitter } from "~/server/emitter";
import { authProcedure } from "~/server/procedures";
import { wordIdSchema } from "~/server/validation";

export const procedure = authProcedure
  .input(
    z.strictObject({
      id: wordIdSchema,
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const db = getDatabase();
    const gameWord = await db
      .selectFrom("words")
      .innerJoin("games", (qb) => qb.onRef("words.gameId", "=", "games.id"))
      .where("words.id", "=", input.id)
      .where("games.ownerId", "=", ctx.auth.userId)
      .select(["games.id as gameId", "games.state as gameState"])
      .executeTakeFirst();
    if (!gameWord) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message:
          "Word not found or you are not the owner of the game that contains this word",
      });
    }
    if (gameWord.gameState.phase !== "start") {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Words can only be removed on start phase",
      });
    }
    await db
      .deleteFrom("words")
      .where("words.id", "=", input.id)
      .executeTakeFirst();
    const emitter = getEmitter(ctx, gameWord.gameId);
    emitter.trigger("word:remove", { id: input.id });
  });
