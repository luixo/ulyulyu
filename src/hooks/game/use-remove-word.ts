import { useMutation } from "@tanstack/react-query";
import { omit } from "remeda";
import { useEventCallback } from "usehooks-ts";

import type { WordId } from "~/db/database.gen";
import { useGame } from "~/hooks/use-game";
import { useSubscription } from "~/hooks/use-subscription";
import { useInvalidateCache, useUpdateCache } from "~/hooks/use-update-cache";
import { useTRPC } from "~/utils/trpc";

const useRemoveWordCache = () => {
  const trpc = useTRPC();
  const { id } = useGame();
  const updateGameCache = useUpdateCache(trpc.games.get.queryFilter({ id }));
  return useEventCallback((wordId: WordId) =>
    updateGameCache((game) => ({
      ...game,
      words: omit(game.words, [wordId]),
    })),
  );
};

export const useRemoveWordMutation = () => {
  const trpc = useTRPC();
  const removeWordCache = useRemoveWordCache();
  const { id } = useGame();
  const invalidateGameCache = useInvalidateCache(
    trpc.games.get.queryFilter({ id }),
  );
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
    useEventCallback(({ id }) => removeWordCache(id)),
  );
};
