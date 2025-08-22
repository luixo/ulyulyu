import { TRPCError } from "@trpc/server";
import { entries, fromEntries } from "remeda";
import { z } from "zod";

import { getDatabase } from "~/db";
import type { GameId, UserId, WordId } from "~/db/database.gen";
import { maskUserId } from "~/server/mask";
import { authProcedure } from "~/server/procedures";
import { gameIdSchema } from "~/server/validation";
import type { SubscriptionMapping } from "~/types/subscription";

const sortByKey = <T extends Record<string, unknown>>(object: T): T =>
  fromEntries(
    entries(object).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)),
  ) as T;

type TeamMapping = Record<UserId, { vote: UserId | null; definition: string }>;

export const getRevealMap = (
  gameId: GameId,
  ownerId: UserId,
  wordId: WordId,
  teamMapping: TeamMapping,
): SubscriptionMapping["guessing:reveal"]["mapping"] =>
  entries(teamMapping).reduce<
    SubscriptionMapping["guessing:reveal"]["mapping"]
  >(
    (acc, [teamId, { vote }]) => {
      if (!vote) {
        throw new Error(
          `Expected to have a vote from user "${teamId}" at revealed time`,
        );
      }
      return {
        ...acc,
        [maskUserId(teamId, gameId, wordId)]: {
          id: teamId,
          vote: vote === ownerId ? null : vote,
        },
      };
    },
    { [maskUserId(ownerId, gameId, wordId)]: null },
  );

export const getPackedResults = <
  T extends {
    wordId: WordId;
    teamId: UserId;
  },
  D,
  TD,
>(
  results: T[],
  getData: (result: T) => D,
  getTeamData: (result: T) => TD,
): Record<WordId, D & { teamMapping: Record<UserId, TD> }> =>
  results.reduce<Record<WordId, D & { teamMapping: Record<UserId, TD> }>>(
    (acc, result) => {
      const teamData = getTeamData(result);
      return {
        ...acc,
        [result.wordId]: acc[result.wordId]
          ? {
              ...acc[result.wordId],
              teamMapping: {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                ...acc[result.wordId]!.teamMapping,
                [result.teamId]: teamData,
              },
            }
          : {
              ...getData(result),
              teamMapping: { [result.teamId]: teamData },
            },
      };
    },
    {},
  );

export const procedure = authProcedure
  .input(z.object({ gameId: gameIdSchema }))
  .query(async ({ input, ctx }) => {
    const db = getDatabase();
    const results = await db
      .selectFrom("words")
      .where("words.gameId", "=", input.gameId)
      .innerJoin("definitions", (qb) =>
        qb.onRef("words.id", "=", "definitions.wordId"),
      )
      .innerJoin("games", (qb) => qb.onRef("games.id", "=", "words.gameId"))
      .select([
        "games.ownerId as ownerId",
        "words.id as wordId",
        "words.definition as realDefinition",
        "definitions.userId as teamId",
        "definitions.definition",
        "definitions.guessUserId",
        "words.revealed",
      ])
      .execute();
    if (results.length === 0) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Game does not exist",
      });
    }
    if (!results.some(({ teamId }) => teamId === ctx.auth.userId)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You don't participate in this game",
      });
    }

    const packedResults = getPackedResults(
      results,
      ({ ownerId, revealed, realDefinition }) => ({
        ownerId,
        revealed,
        realDefinition,
      }),
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
          definitions: Record<string, string>;
          vote: string | null;
          readiness: Record<UserId, boolean>;
          revealMap: SubscriptionMapping["guessing:reveal"]["mapping"] | null;
        }
      >
    >((acc, [wordId, { ownerId, realDefinition, teamMapping, revealed }]) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const selfVote = teamMapping[ctx.auth.userId]!.vote;
      return {
        ...acc,
        [wordId]: {
          definitions: sortByKey(
            entries(teamMapping).reduce(
              (subacc, [teamId, { definition }]) =>
                teamId === ctx.auth.userId
                  ? subacc
                  : {
                      ...subacc,
                      [maskUserId(teamId, input.gameId, wordId)]: definition,
                    },
              { [maskUserId(ownerId, input.gameId, wordId)]: realDefinition },
            ),
          ),
          vote: selfVote ? maskUserId(selfVote, input.gameId, wordId) : null,
          readiness: entries(teamMapping).reduce(
            (subacc, [teamId, { vote }]) => ({
              ...subacc,
              [teamId]: Boolean(vote),
            }),
            {},
          ),
          revealMap: revealed
            ? getRevealMap(input.gameId, ownerId, wordId, teamMapping)
            : null,
        },
      };
    }, {});
  });
