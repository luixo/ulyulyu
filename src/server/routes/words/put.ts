import { TRPCError } from "@trpc/server";
import { v4 } from "uuid";
import { z } from "zod";

import { getDatabase } from "~/db";
import { getEmitter } from "~/server/emitter";
import { authProcedure } from "~/server/procedures";
import {
  type WordId,
  definitionSchema,
  gameIdSchema,
  termSchema,
} from "~/server/validation";

export const procedure = authProcedure
  .input(
    z.strictObject({
      gameId: gameIdSchema,
      term: termSchema,
      definition: definitionSchema,
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const db = getDatabase();
    const gameWord = await db
      .selectFrom("games")
      .leftJoin("words", (qb) => qb.onRef("words.gameId", "=", "games.id"))
      .where("games.id", "=", input.gameId)
      .where("games.ownerId", "=", ctx.auth.userId)
      .orderBy("words.position", "desc")
      .select([
        "games.state as gameState",
        "words.position as lastWordPosition",
      ])
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
        message: "Words can be added only on start phase",
      });
    }
    const wordId = v4() as WordId;
    const wordPosition = (gameWord.lastWordPosition ?? -1) + 1;
    const word = await db
      .insertInto("words")
      .values({
        id: wordId,
        gameId: input.gameId,
        term: input.term,
        position: wordPosition,
        definition: input.definition,
        revealed: false,
      })
      .returning(["words.id", "words.position"])
      .executeTakeFirstOrThrow();
    const emitter = getEmitter(ctx, input.gameId);
    emitter.trigger("word:add", {
      id: wordId,
      position: word.position,
      term: input.term,
      // We don't disclose original definitions to player
      definition: "",
    });
    return { id: word.id, position: word.position };
  });
