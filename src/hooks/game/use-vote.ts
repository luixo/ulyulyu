import React from "react";

import { useMutation } from "@tanstack/react-query";
import { useEventCallback } from "usehooks-ts";

import { UserContext } from "~/contexts/user-id-context";
import { useGame } from "~/hooks/use-game";
import { useSubscription } from "~/hooks/use-subscription";
import { useInvalidateCache, useUpdateCache } from "~/hooks/use-update-cache";
import type { UserId, WordId } from "~/server/validation";
import { useTRPC } from "~/utils/trpc";

const useChangeGuessPlayerReadyCache = () => {
  const trpc = useTRPC();
  const { id: gameId } = useGame();
  const updatePlayerGuessingCache = useUpdateCache(
    trpc.definitions.getPlayerGuessing.queryFilter({ gameId }),
  );
  return useEventCallback((wordId: WordId, teamId: UserId, ready: boolean) =>
    updatePlayerGuessingCache((defs) =>
      defs[wordId]
        ? {
            ...defs,
            [wordId]: {
              ...defs[wordId],
              readiness: {
                ...defs[wordId].readiness,
                [teamId]: ready,
              },
            },
          }
        : defs,
    ),
  );
};

const useChangeGuessPlayerVoteCache = () => {
  const trpc = useTRPC();
  const { id: gameId } = useGame();
  const updatePlayerGuessingCache = useUpdateCache(
    trpc.definitions.getPlayerGuessing.queryFilter({ gameId }),
  );
  return useEventCallback((wordId: WordId, vote: string | null) =>
    updatePlayerGuessingCache((defs) =>
      defs[wordId]
        ? {
            ...defs,
            [wordId]: {
              ...defs[wordId],
              vote,
            },
          }
        : defs,
    ),
  );
};

const useChangeGuessAdminReadyCache = () => {
  const trpc = useTRPC();
  const { id: gameId } = useGame();
  const updateAdminGuessingCache = useUpdateCache(
    trpc.definitions.getAdminGuessing.queryFilter({ gameId }),
  );
  return useEventCallback((wordId: WordId, teamId: UserId, ready: boolean) =>
    updateAdminGuessingCache((defs) =>
      defs[wordId]
        ? {
            ...defs,
            [wordId]: {
              ...defs[wordId],
              readiness: {
                ...defs[wordId].readiness,
                [teamId]: ready,
              },
            },
          }
        : defs,
    ),
  );
};

export const useVoteMutation = () => {
  const trpc = useTRPC();
  const { id } = useGame();
  const { id: selfUserId } = React.use(UserContext);
  const invalidatePlayerGuessingCache = useInvalidateCache(
    trpc.definitions.getPlayerGuessing.queryFilter({ gameId: id }),
  );
  const changeGuessPlayerReadyCache = useChangeGuessPlayerReadyCache();
  const changeGuessPlayerVoteCache = useChangeGuessPlayerVoteCache();
  return useMutation(
    trpc.definitions.vote.mutationOptions({
      onMutate: (variables) => {
        changeGuessPlayerReadyCache(variables.wordId, selfUserId, true);
        changeGuessPlayerVoteCache(variables.wordId, variables.guessUserId);
      },
      onError: () => {
        invalidatePlayerGuessingCache();
        invalidatePlayerGuessingCache();
      },
    }),
  );
};

export const useSubscribeToTeamVoted = () => {
  const { isOwner } = useGame();
  const changeGuessPlayerReadyCache = useChangeGuessPlayerReadyCache();
  const changeGuessAdminReadyCache = useChangeGuessAdminReadyCache();

  return useSubscription(
    "guessing:ready",
    useEventCallback(({ wordId, teamId, ready }) => {
      if (isOwner) {
        changeGuessAdminReadyCache(wordId, teamId, ready);
      } else {
        changeGuessPlayerReadyCache(wordId, teamId, ready);
      }
    }),
  );
};
