import React from "react";

import { useMutation } from "@tanstack/react-query";
import { omit } from "remeda";

import type { WordId } from "~/db/database.gen";
import { useSubscription } from "~/hooks/use-subscription";
import { useUpdateGameCache } from "~/hooks/use-update-cache";
import { useTRPC } from "~/utils/trpc";

const useRemoveWordCache = () => {
  const [updateGameCache] = useUpdateGameCache();
  return React.useCallback(
    (wordId: WordId) =>
      updateGameCache((game) => ({
        ...game,
        words: omit(game.words, [wordId]),
      })),
    [updateGameCache],
  );
};

export const useRemoveWordMutation = () => {
  const trpc = useTRPC();
  const removeWordCache = useRemoveWordCache();
  const [, invalidateGameCache] = useUpdateGameCache();
  return useMutation(
    trpc.words.remove.mutationOptions({
      onMutate: (variables) => removeWordCache(variables.id),
      onError: () => invalidateGameCache(),
    }),
  );
};

export const useSubscribeToWordRemoval = () => {
  const removeWordCache = useRemoveWordCache();
  return useSubscription(
    "word:remove",
    React.useCallback(({ id }) => removeWordCache(id), [removeWordCache]),
  );
};
