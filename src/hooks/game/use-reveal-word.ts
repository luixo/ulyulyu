import { useMutation } from "@tanstack/react-query";
import { useEventCallback } from "usehooks-ts";

import { useGame } from "~/hooks/use-game";
import { useSubscription } from "~/hooks/use-subscription";
import { useUpdateCache } from "~/hooks/use-update-cache";
import type { WordId } from "~/server/validation";
import type { SubscriptionMapping } from "~/types/subscription";
import { useTRPC } from "~/utils/trpc";

const useChangeGuessAdminWordRevealMapCache = () => {
  const trpc = useTRPC();
  const { id: gameId } = useGame();
  const updateAdminGuessingCache = useUpdateCache(
    trpc.definitions.getAdminGuessing.queryFilter({ gameId }),
  );
  return useEventCallback(
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
  );
};

const useChangeGuessPlayerWordRevealMapCache = () => {
  const trpc = useTRPC();
  const { id: gameId } = useGame();
  const updatePlayerGuessingCache = useUpdateCache(
    trpc.definitions.getPlayerGuessing.queryFilter({ gameId }),
  );
  return useEventCallback(
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
    useEventCallback(({ wordId, mapping }) => {
      if (isOwner) {
        changeGuessAdminWordRevealMapCache(wordId, mapping);
      } else {
        changeGuessPlayerWordRevealMapCache(wordId, mapping);
      }
    }),
  );
};
