import React from "react";

import { WordsId } from "@/db/models";
import { Game } from "@/hooks/use-game";
import { useMutationHook } from "@/hooks/use-mutation-hook";
import { usePusher } from "@/hooks/use-pusher";
import { useUpdateGameCache } from "@/hooks/use-update-cache";
import { trpc } from "@/lib/trpc";

type Word = Game["words"][WordsId];

const useAddWordCache = () => {
	const [updateGameCache, revertGameCache] = useUpdateGameCache();
	return [
		React.useCallback(
			(wordId: WordsId, word: Word) =>
				updateGameCache((game) => void (game.words[wordId] = word)),
			[updateGameCache],
		),
		revertGameCache,
	] as const;
};

const useChangeWordCache = () => {
	const [updateGameCache, revertGameCache] = useUpdateGameCache();
	return [
		React.useCallback(
			(actual: { id: WordsId; position: number }, wordId: WordsId) =>
				updateGameCache((game) => {
					game.words[actual.id] = {
						...game.words[wordId],
						position: actual.position,
					};
					delete game.words[wordId];
				}),
			[updateGameCache],
		),
		revertGameCache,
	] as const;
};

export const useAddWordMutation = () => {
	const [addWordCache, revertWordCache] = useAddWordCache();
	const [updateWordCache] = useChangeWordCache();
	return trpc.words.put.useMutation(
		useMutationHook({
			getKey: () => Math.random().toString(),
			onMutate: (variables) => {
				const id = Math.random().toString();
				return {
					context: id,
					patches: addWordCache(id, {
						position: Infinity,
						term: variables.term,
						definition: variables.definition,
					}),
				};
			},
			revert: revertWordCache,
			onSuccess: updateWordCache,
		}),
	);
};

export const useSubscribeToWordAddition = () => {
	const [addWordCache] = useAddWordCache();
	return usePusher(
		"word:add",
		React.useCallback(
			({ id, ...word }) => addWordCache(id, word),
			[addWordCache],
		),
	);
};
