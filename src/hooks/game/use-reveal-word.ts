import React from "react";

import { useMutation } from "@tanstack/react-query";

import type { WordId } from "~/db/database.gen";
import { useGame } from "~/hooks/use-game";
import { useSubscription } from "~/hooks/use-subscription";
import {
  useUpdateAdminGuessingCache,
  useUpdatePlayerGuessingCache,
} from "~/hooks/use-update-cache";
import type { SubscriptionMapping } from "~/types/subscription";
import { useTRPC } from "~/utils/trpc";

const useChangeGuessAdminWordRevealMapCache = () => {
  const [updateAdminGuessingCache] = useUpdateAdminGuessingCache();
  return React.useCallback(
    (
      wordId: WordId,
      revealMap: SubscriptionMapping["guessing:reveal"]["mapping"],
    ) =>
      updateAdminGuessingCache((defs) =>
        defs[wordId]
          ? {
              ...defs,
              [wordId]: { ...defs[wordId], revealMap },
            }
          : defs,
      ),
    [updateAdminGuessingCache],
  );
};

const useChangeGuessPlayerWordRevealMapCache = () => {
  const [updatePlayerGuessingCache] = useUpdatePlayerGuessingCache();
  return React.useCallback(
    (
      wordId: WordId,
      revealMap: SubscriptionMapping["guessing:reveal"]["mapping"],
    ) =>
      updatePlayerGuessingCache((defs) =>
        defs[wordId]
          ? {
              ...defs,
              [wordId]: { ...defs[wordId], revealMap },
            }
          : defs,
      ),
    [updatePlayerGuessingCache],
  );
};

export const useRevealWordMutation = () => {
  const trpc = useTRPC();
  const changeGuessAdminWordRevealMapCache =
    useChangeGuessAdminWordRevealMapCache();
  return useMutation(
    trpc.definitions.reveal.mutationOptions({
      onSuccess: (result, variables) =>
        changeGuessAdminWordRevealMapCache(variables.wordId, result),
    }),
  );
};

export const useSubscribeToWordReveal = () => {
  const { isOwner } = useGame();
  const changeGuessAdminWordRevealMapCache =
    useChangeGuessAdminWordRevealMapCache();
  const changeGuessPlayerWordRevealMapCache =
    useChangeGuessPlayerWordRevealMapCache();
  return useSubscription(
    "guessing:reveal",
    React.useCallback(
      ({ wordId, mapping }) => {
        if (isOwner) {
          changeGuessAdminWordRevealMapCache(wordId, mapping);
        } else {
          changeGuessPlayerWordRevealMapCache(wordId, mapping);
        }
      },
      [
        changeGuessAdminWordRevealMapCache,
        changeGuessPlayerWordRevealMapCache,
        isOwner,
      ],
    ),
  );
};
