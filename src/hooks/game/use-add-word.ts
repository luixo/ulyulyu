import React from "react";

import { useMutation } from "@tanstack/react-query";
import { omit } from "remeda";

import type { WordId } from "~/db/database.gen";
import type { Game } from "~/hooks/use-game";
import { useSubscription } from "~/hooks/use-subscription";
import { useUpdateGameCache } from "~/hooks/use-update-cache";
import { useTRPC } from "~/utils/trpc";

const useAddWordCache = () => {
  const [updateGameCache] = useUpdateGameCache();
  return React.useCallback(
    (wordId: WordId, word: Game["words"][WordId]) =>
      updateGameCache((prevGame) => ({
        ...prevGame,
        words: { ...prevGame.words, [wordId]: word },
      })),
    [updateGameCache],
  );
};

const useRemoveWordCache = () => {
  const [updateGameCache] = useUpdateGameCache();
  return React.useCallback(
    (wordId: WordId) =>
      updateGameCache((prevGame) => ({
        ...prevGame,
        words: omit(prevGame.words, [wordId]),
      })),
    [updateGameCache],
  );
};

export const useAddWordMutation = () => {
  const trpc = useTRPC();
  const [, invalidateGameCache] = useUpdateGameCache();
  const addWordCache = useAddWordCache();
  const removeWordCache = useRemoveWordCache();
  return useMutation(
    trpc.words.put.mutationOptions({
      onMutate: (variables) => {
        const id = Math.random().toString() as WordId;
        addWordCache(id, {
          position: Infinity,
          term: variables.term,
          definition: variables.definition,
        });
        return { id };
      },
      onSuccess: (result, variables, context) => {
        removeWordCache(context.id);
        addWordCache(result.id, {
          position: result.position,
          term: variables.term,
          definition: variables.definition,
        });
      },
      onError: () => invalidateGameCache(),
    }),
  );
};

export const useSubscribeToWordAddition = () => {
  const addWordCache = useAddWordCache();
  return useSubscription(
    "word:add",
    React.useCallback(
      ({ id, ...word }) => addWordCache(id, word),
      [addWordCache],
    ),
  );
};
