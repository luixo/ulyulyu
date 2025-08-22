import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getDatabase } from "~/db";
import { getEmitter } from "~/server/emitter";
import { demaskUserId } from "~/server/mask";
import { authProcedure } from "~/server/procedures";
import {
  gameIdSchema,
  guessUserIdSchema,
  wordIdSchema,
} from "~/server/validation";

export const procedure = authProcedure
  .input(
    z.strictObject({
      gameId: gameIdSchema,
      wordId: wordIdSchema,
      guessUserId: guessUserIdSchema,
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const db = getDatabase();
    const gameWord = await db
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
      .select([
        "games.state as gameState",
        "words.position as wordPosition",
        "words.revealed",
      ])
      .executeTakeFirst();
    if (!gameWord) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Game not found or you don't participate in a game",
      });
    }
    if (gameWord.gameState.phase !== "guessing") {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Game is not in the guessing state",
      });
    }
    if (gameWord.gameState.currentPosition > gameWord.wordPosition) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "Seems like you're trying to change your vote, it is forbidden at the moment",
      });
    }
    if (gameWord.revealed) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "Seems like you're trying to change your vote after results are revaled",
      });
    }
    await db
      .updateTable("definitions")
      .set({ guessUserId: demaskUserId(input.guessUserId, input.gameId) })
      .where("definitions.wordId", "=", input.wordId)
      .where("definitions.userId", "=", ctx.auth.userId)
      .executeTakeFirst();
    const emitter = getEmitter(ctx, input.gameId);
    emitter.trigger("guessing:ready", {
      teamId: ctx.auth.userId,
      wordId: input.wordId,
      ready: Boolean(input.guessUserId),
    });
  });
