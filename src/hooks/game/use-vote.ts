import React from "react";

import { useMutation } from "@tanstack/react-query";

import { UserContext } from "~/contexts/user-id-context";
import type { UserId, WordId } from "~/db/database.gen";
import { useGame } from "~/hooks/use-game";
import { useSubscription } from "~/hooks/use-subscription";
import {
  useUpdateAdminGuessingCache,
  useUpdatePlayerGuessingCache,
} from "~/hooks/use-update-cache";
import { useTRPC } from "~/utils/trpc";

const useChangeGuessPlayerReadyCache = () => {
  const [updatePlayerGuessingCache] = useUpdatePlayerGuessingCache();
  return React.useCallback(
    (wordId: WordId, teamId: UserId, ready: boolean) =>
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
    [updatePlayerGuessingCache],
  );
};

const useChangeGuessPlayerVoteCache = () => {
  const [updatePlayerGuessingCache] = useUpdatePlayerGuessingCache();
  return React.useCallback(
    (wordId: WordId, vote: string | null) =>
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
    [updatePlayerGuessingCache],
  );
};

const useChangeGuessAdminReadyCache = () => {
  const [updateAdminGuessingCache] = useUpdateAdminGuessingCache();
  return React.useCallback(
    (wordId: WordId, teamId: UserId, ready: boolean) =>
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
    [updateAdminGuessingCache],
  );
};

export const useVoteMutation = () => {
  const trpc = useTRPC();
  const { id: selfUserId } = React.use(UserContext);
  const [, invalidatePlayerGuessingCache] = useUpdatePlayerGuessingCache();
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
    React.useCallback(
      ({ wordId, teamId, ready }) => {
        if (isOwner) {
          changeGuessAdminReadyCache(wordId, teamId, ready);
        } else {
          changeGuessPlayerReadyCache(wordId, teamId, ready);
        }
      },
      [changeGuessPlayerReadyCache, changeGuessAdminReadyCache, isOwner],
    ),
  );
};
