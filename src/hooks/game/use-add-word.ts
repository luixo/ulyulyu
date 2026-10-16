import { useMutation } from "@tanstack/react-query";
import { omit } from "remeda";
import { useEventCallback } from "usehooks-ts";
import { useGame } from "~/hooks/use-game";
import type { Game } from "~/hooks/use-game";
import { useSubscription } from "~/hooks/use-subscription";
import { useInvalidateCache, useUpdateCache } from "~/hooks/use-update-cache";
import type { WordId } from "~/server/validation";
import { useTRPC } from "~/utils/trpc";

const useAddWordCache = () => {
	const trpc = useTRPC();
	const { id } = useGame();
	const updateGameCache = useUpdateCache(trpc.games.get.queryFilter({ id }));
	return useEventCallback((wordId: WordId, word: Game["words"][WordId]) =>
		updateGameCache((prevGame) => ({
			...prevGame,
			words: { ...prevGame.words, [wordId]: word },
		})),
	);
};

const useRemoveWordCache = () => {
	const trpc = useTRPC();
	const { id } = useGame();
	const updateGameCache = useUpdateCache(trpc.games.get.queryFilter({ id }));
	return useEventCallback((wordId: WordId) =>
		updateGameCache((prevGame) => ({
			...prevGame,
			words: omit(prevGame.words, [wordId]),
		})),
	);
};

export const useAddWordMutation = () => {
	const trpc = useTRPC();
	const { id } = useGame();
	const invalidateGameCache = useInvalidateCache(
		trpc.games.get.queryFilter({ id }),
	);
	const addWordCache = useAddWordCache();
	const removeWordCache = useRemoveWordCache();
	return useMutation(
		trpc.words.put.mutationOptions({
			onError: () => invalidateGameCache(),
			onMutate: (variables) => {
				// Runs on a mutation event, not during render; this ID tracks an optimistic word.
				// oxlint-disable-next-line react/purity
				const wordId = Math.random().toString() as WordId;
				addWordCache(wordId, {
					definition: variables.definition,
					position: Infinity,
					term: variables.term,
				});
				return { id: wordId };
			},
			onSuccess: (result, variables, context) => {
				removeWordCache(context.id);
				addWordCache(result.id, {
					definition: variables.definition,
					position: result.position,
					term: variables.term,
				});
			},
		}),
	);
};

export const useSubscribeToWordAddition = () => {
	const addWordCache = useAddWordCache();
	return useSubscription(
		"word:add",
		useEventCallback(({ id, ...word }) => {
			addWordCache(id, word);
		}),
	);
};
