import { TRPCError } from "@trpc/server";
import { entries } from "remeda";
import { z } from "zod";

import { getDatabase } from "~/db";
import { authProcedure } from "~/server/procedures";
import type { UserId, WordId } from "~/server/validation";
import { gameIdSchema } from "~/server/validation";
import type { SubscriptionMapping } from "~/types/subscription";

import { getPackedResults, getRevealMap } from "./get-player-guessing";

export const procedure = authProcedure
  .input(z.object({ gameId: gameIdSchema }))
  .query(async ({ input, ctx }) => {
    const db = getDatabase();
    const results = await db
      .selectFrom("games")
      .where("games.id", "=", input.gameId)
      .where("games.ownerId", "=", ctx.auth.userId)
      .innerJoin("teams", (qb) => qb.onRef("teams.gameId", "=", "games.id"))
      .innerJoin("words", (qb) => qb.onRef("words.gameId", "=", "games.id"))
      .innerJoin("definitions", (qb) =>
        qb
          .onRef("definitions.wordId", "=", "words.id")
          .onRef("definitions.userId", "=", "teams.userId"),
      )
      .select([
        "words.id as wordId",
        "words.definition as originalDefinition",
        "words.revealed",
        "teams.userId as teamId",
        "definitions.definition",
        "definitions.guessUserId",
      ])
      .execute();
    if (results.length === 0) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Game does not exist or you're not the owner",
      });
    }
    const packedResults = getPackedResults(
      results,
      ({ revealed, originalDefinition }) => ({ revealed, originalDefinition }),
      ({ guessUserId, definition, wordId, teamId }) => {
        if (!definition) {
          throw new Error(
            `Expected to have definition for team "${teamId}" at word "${wordId}" at guessing phase`,
          );
        }
        return { vote: guessUserId, definition };
      },
    );

    return entries(packedResults).reduce<
      Record<
        WordId,
        {
          originalDefinition: string;
          definitions: Record<UserId, string>;
          readiness: Record<UserId, boolean>;
          revealMap: SubscriptionMapping["guessing:reveal"]["mapping"] | null;
        }
      >
    >(
      (acc, [wordId, { originalDefinition, teamMapping, revealed }]) => ({
        ...acc,
        [wordId]: {
          originalDefinition,
          definitions: entries(teamMapping).reduce(
            (subacc, [teamId, { definition }]) => ({
              ...subacc,
              [teamId]: definition,
            }),
            {},
          ),
          readiness: entries(teamMapping).reduce(
            (subacc, [teamId, { vote }]) => ({
              ...subacc,
              [teamId]: Boolean(vote),
            }),
            {},
          ),
          revealMap: revealed
            ? getRevealMap(input.gameId, ctx.auth.userId, wordId, teamMapping)
            : null,
        },
      }),
      {},
    );
  });
