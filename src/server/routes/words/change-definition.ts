import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getDatabase } from "~/db";
import { authProcedure } from "~/server/procedures";
import { definitionSchema, wordIdSchema } from "~/server/validation";

export const procedure = authProcedure
  .input(
    z.strictObject({
      wordId: wordIdSchema,
      definition: definitionSchema,
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const db = getDatabase();
    const gameWord = await db
      .selectFrom("words")
      .innerJoin("games", (qb) =>
        qb
          .onRef("games.id", "=", "words.gameId")
          .on("games.ownerId", "=", ctx.auth.userId),
      )
      .where("words.id", "=", input.wordId)
      .select(["games.state as gameState"])
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
        message: "Word definition can be changed only on start phase",
      });
    }
    await db
      .updateTable("words")
      .set({ definition: input.definition })
      .where("words.id", "=", input.wordId)
      .executeTakeFirst();
  });
