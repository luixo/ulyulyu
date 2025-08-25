import { useMutation } from "@tanstack/react-query";
import { useEventCallback } from "usehooks-ts";

import type { WordId } from "~/db/database.gen";
import { useGame } from "~/hooks/use-game";
import { useSubscription } from "~/hooks/use-subscription";
import { useInvalidateCache, useUpdateCache } from "~/hooks/use-update-cache";
import { useTRPC } from "~/utils/trpc";

const useChangeWordTermCache = () => {
  const trpc = useTRPC();
  const { id } = useGame();
  const updateGameCache = useUpdateCache(trpc.games.get.queryFilter({ id }));
  return useEventCallback((wordId: WordId, term: string) =>
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
  );
};

export const useUpdateTermMutation = () => {
  const trpc = useTRPC();
  const changeWordTermCache = useChangeWordTermCache();
  const { id } = useGame();
  const invalidateGameCache = useInvalidateCache(
    trpc.games.get.queryFilter({ id }),
  );
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
    useEventCallback(({ wordId, term }) => changeWordTermCache(wordId, term)),
  );
};
