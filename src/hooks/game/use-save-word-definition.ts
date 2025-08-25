import { useMutation } from "@tanstack/react-query";
import { useEventCallback } from "usehooks-ts";

import type { WordId } from "~/db/database.gen";
import { useGame } from "~/hooks/use-game";
import { useInvalidateCache, useUpdateCache } from "~/hooks/use-update-cache";
import { useTRPC } from "~/utils/trpc";

const useChangeWordDefinitionCache = () => {
  const trpc = useTRPC();
  const { id } = useGame();
  const updateGameCache = useUpdateCache(trpc.games.get.queryFilter({ id }));
  return useEventCallback((wordId: WordId, definition: string) =>
    updateGameCache((game) => ({
      ...game,
      words: game.words[wordId]
        ? {
            ...game.words,
            [wordId]: { ...game.words[wordId], definition },
          }
        : game.words,
    })),
  );
};

export const useSaveWordDefinitionMutation = () => {
  const trpc = useTRPC();
  const changeWordDefinitionCache = useChangeWordDefinitionCache();
  const { id } = useGame();
  const invalidateGameCache = useInvalidateCache(
    trpc.games.get.queryFilter({ id }),
  );

  return useMutation(
    trpc.words.changeDefinition.mutationOptions({
      onMutate: (variables) =>
        changeWordDefinitionCache(variables.wordId, variables.definition),
      onError: () => invalidateGameCache(),
    }),
  );
};
