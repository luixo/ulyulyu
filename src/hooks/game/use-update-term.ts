import React from "react";

import { useMutation } from "@tanstack/react-query";

import type { WordId } from "~/db/database.gen";
import { useSubscription } from "~/hooks/use-subscription";
import { useUpdateGameCache } from "~/hooks/use-update-cache";
import { useTRPC } from "~/utils/trpc";

const useChangeWordTermCache = () => {
  const [updateGameCache] = useUpdateGameCache();
  return React.useCallback(
    (wordId: WordId, term: string) =>
      updateGameCache((game) => ({
        ...game,
        words: game.words[wordId]
          ? {
              ...game.words,
              [wordId]: {
                ...game.words[wordId],
                term,
              },
            }
          : game.words,
      })),
    [updateGameCache],
  );
};

export const useUpdateTermMutation = () => {
  const trpc = useTRPC();
  const changeWordTermCache = useChangeWordTermCache();
  const [, invalidateGameCache] = useUpdateGameCache();
  return useMutation(
    trpc.words.changeTerm.mutationOptions({
      onMutate: (variables) =>
        changeWordTermCache(variables.wordId, variables.term),
      onError: () => invalidateGameCache(),
    }),
  );
};

export const useSubscribeToTermUpdate = () => {
  const changeWordTermCache = useChangeWordTermCache();
  return useSubscription(
    "word:term-update",
    React.useCallback(
      ({ wordId, term }) => changeWordTermCache(wordId, term),
      [changeWordTermCache],
    ),
  );
};
