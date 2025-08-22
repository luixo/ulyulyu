import React from "react";

import { useMutation } from "@tanstack/react-query";

import type { WordId } from "~/db/database.gen";
import { useUpdateGameCache } from "~/hooks/use-update-cache";
import { useTRPC } from "~/utils/trpc";

const useChangeWordDefinitionCache = () => {
  const [updateGameCache] = useUpdateGameCache();
  return React.useCallback(
    (wordId: WordId, definition: string) =>
      updateGameCache((game) => ({
        ...game,
        words: game.words[wordId]
          ? {
              ...game.words,
              [wordId]: { ...game.words[wordId], definition },
            }
          : game.words,
      })),
    [updateGameCache],
  );
};

export const useSaveWordDefinitionMutation = () => {
  const trpc = useTRPC();
  const changeWordDefinitionCache = useChangeWordDefinitionCache();
  const [, invalidateGameCache] = useUpdateGameCache();

  return useMutation(
    trpc.words.changeDefinition.mutationOptions({
      onMutate: (variables) =>
        changeWordDefinitionCache(variables.wordId, variables.definition),
      onError: () => invalidateGameCache(),
    }),
  );
};
