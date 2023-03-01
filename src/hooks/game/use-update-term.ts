import React from "react";

import { WordsId } from "@/db/models";
import { useMutationHook } from "@/hooks/use-mutation-hook";
import { usePusher } from "@/hooks/use-pusher";
import { useUpdateGameCache } from "@/hooks/use-update-cache";
import { trpc } from "@/lib/trpc";

const useChangeWordTermCache = () => {
	const [updateGameCache, revertGameCache] = useUpdateGameCache();
	return [
		React.useCallback(
			(wordId: WordsId, term: string) =>
				updateGameCache((game) => void (game.words[wordId].term = term)),
			[updateGameCache],
		),
		revertGameCache,
	] as const;
};

export const useUpdateTermMutation = () => {
	const [changeWordTermCache, revertWordTermCache] = useChangeWordTermCache();
	return trpc.words.changeTerm.useMutation(
		useMutationHook({
			getKey: (variables) => variables.wordId,
			onMutate: (variables) =>
				changeWordTermCache(variables.wordId, variables.term),
			revert: revertWordTermCache,
		}),
	);
};

export const useSubscribeToTermUpdate = () => {
	const [changeWordTermCache] = useChangeWordTermCache();
	return usePusher(
		"word:term-update",
		React.useCallback(
			({ wordId, term }) => changeWordTermCache(wordId, term),
			[changeWordTermCache],
		),
	);
};
