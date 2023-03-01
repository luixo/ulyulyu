import React from "react";

import { WordsId } from "@/db/models";
import { useMutationHook } from "@/hooks/use-mutation-hook";
import { useUpdateGameCache } from "@/hooks/use-update-cache";
import { trpc } from "@/lib/trpc";

const useChangeWordDefinitionCache = () => {
	const [updateGameCache, revertGameCache] = useUpdateGameCache();
	return [
		React.useCallback(
			(wordId: WordsId, definition: string) =>
				updateGameCache(
					(game) => void (game.words[wordId].definition = definition),
				),
			[updateGameCache],
		),
		revertGameCache,
	] as const;
};

export const useSaveWordDefinitionMutation = () => {
	const [changeWordDefinitionCache, revertWordDefinitionCache] =
		useChangeWordDefinitionCache();

	return trpc.words.changeDefinition.useMutation(
		useMutationHook({
			getKey: (variables) => variables.wordId,
			onMutate: (variables) =>
				changeWordDefinitionCache(variables.wordId, variables.definition),
			revert: revertWordDefinitionCache,
		}),
	);
};
