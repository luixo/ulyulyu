import React from "react";

import { WordsId } from "@/db/models";
import { useMutationHook } from "@/hooks/use-mutation-hook";
import { usePusher } from "@/hooks/use-pusher";
import { useUpdateGameCache } from "@/hooks/use-update-cache";
import { trpc } from "@/lib/trpc";

const useRemoveWordCache = () => {
	const [updateGameCache, revertGameCache] = useUpdateGameCache();
	return [
		React.useCallback(
			(wordId: WordsId) =>
				updateGameCache((game) => {
					delete game.words[wordId];
				}),
			[updateGameCache],
		),
		revertGameCache,
	] as const;
};

export const useRemoveWordMutation = () => {
	const [removeWordCache, revertWordCache] = useRemoveWordCache();
	return trpc.words.remove.useMutation(
		useMutationHook({
			getKey: (variables) => variables.id,
			onMutate: (variables) => removeWordCache(variables.id),
			revert: revertWordCache,
		}),
	);
};

export const useSubscribeToWordRemoval = () => {
	const [removeWordCache] = useRemoveWordCache();
	return usePusher(
		"word:remove",
		React.useCallback(({ id }) => removeWordCache(id), [removeWordCache]),
	);
};
