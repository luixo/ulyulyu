import { customAlphabet } from "nanoid/non-secure";

import { getDatabase } from "~/db";
import { GAMES } from "~/db/const";
import { authProcedure } from "~/server/procedures";
import type { GameId } from "~/server/validation";

const nanoid = customAlphabet(GAMES.TYPES.ID_ALPHABET, GAMES.TYPES.ID_LENGTH);

export const procedure = authProcedure.mutation(async ({ ctx }) => {
  const db = getDatabase();
  const now = new Date();
  const gameId = nanoid() as GameId;
  const game = await db
    .insertInto("games")
    .values({
      id: gameId,
      ownerId: ctx.auth.userId,
      state: { phase: "start" },
      createdAt: now,
    })
    .returning(["games.id", "games.createdAt"])
    .executeTakeFirstOrThrow();
  return game;
});
