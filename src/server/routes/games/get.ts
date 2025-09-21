import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getDatabase } from "~/db";
import { authProcedure } from "~/server/procedures";
import type { UserId, WordId } from "~/server/validation";
import { gameIdSchema } from "~/server/validation";

export const procedure = authProcedure
  .input(z.object({ id: gameIdSchema }))
  .query(async ({ input, ctx }) => {
    const db = getDatabase();
    const [game, teams, words] = await Promise.all([
      db
        .selectFrom("games")
        .where("games.id", "=", input.id)
        .select(["games.id", "games.state", "games.ownerId"])
        .executeTakeFirst(),
      db
        .selectFrom("teams")
        .where("teams.gameId", "=", input.id)
        .select(["teams.nickname", "teams.userId as teamId", "teams.ready"])
        .execute(),
      db
        .selectFrom("words")
        .where("words.gameId", "=", input.id)
        .leftJoin("definitions", (qb) =>
          qb
            .onRef("definitions.wordId", "=", "words.id")
            .on("definitions.userId", "=", ctx.auth.userId),
        )
        .select([
          "words.id as wordId",
          "words.position",
          "words.term",
          "words.definition",
          "definitions.definition as localDefinition",
        ])
        .execute(),
    ]);
    if (!game) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Game "${input.id}" not found.`,
      });
    }
    const isOwner = game.ownerId === ctx.auth.userId;
    return {
      id: game.id,
      state: game.state,
      isOwner,
      teams: teams.reduce<Record<UserId, { nickname: string; ready: boolean }>>(
        (acc, { nickname, ready, teamId }) => ({
          ...acc,
          [teamId]: {
            nickname,
            ready,
          },
        }),
        {},
      ),
      words: words.reduce<
        Record<
          WordId,
          { position: number; term: string; definition: string | null }
        >
      >(
        (acc, { wordId, position, term, definition, localDefinition }) => ({
          ...acc,
          [wordId]: {
            position,
            term,
            definition: isOwner ? definition : localDefinition,
          },
        }),
        {},
      ),
    };
  });
