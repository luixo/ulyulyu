import React, { SetStateAction } from "react";

import { useGame } from "@/hooks/use-game";
import { useMutationHook } from "@/hooks/use-mutation-hook";
import { usePusher } from "@/hooks/use-pusher";
import { useUpdateGameCache } from "@/hooks/use-update-cache";
import { updateSetStateAction } from "@/lib/cache";
import { trpc } from "@/lib/trpc";

const useChangeGameStateWordPositionCache = () => {
	const [updateGameCache, revertGameCache] = useUpdateGameCache();
	return [
		React.useCallback(
			(positionAction: SetStateAction<number>) =>
				updateGameCache((game) => {
					if (
						game.state.phase !== "proposal" &&
						game.state.phase !== "guessing"
					) {
						throw new Error(
							`Expected to change game word position only in proposal / guessing phase`,
						);
					}
					game.state.currentPosition = updateSetStateAction(
						positionAction,
						game.state.currentPosition,
					);
				}),
			[updateGameCache],
		),
		revertGameCache,
	] as const;
};

export const useGameChangeWordPositionMutation = () => {
	const { words } = useGame();
	const [changeGameStateWordPositionCache, revertGameCache] =
		useChangeGameStateWordPositionCache();
	const getNextPosition = React.useCallback(
		(currentPosition: number, direction: "forward" | "backward") => {
			const sortedWordsValues = Object.values(words).sort(
				(a, b) => a.position - b.position,
			);
			const currentWordIndex = sortedWordsValues.findIndex(
				({ position }) => position === currentPosition,
			);
			if (currentWordIndex === -1) {
				throw new Error(
					`Expected to have word with position "${currentPosition}"`,
				);
			}
			if (direction === "forward") {
				const nextWord = sortedWordsValues[currentWordIndex + 1];
				if (!nextWord) {
					throw new Error(
						`Expected to have next word starting from "${currentPosition}", find none`,
					);
				}
				return nextWord.position;
			}
			const prevWord = sortedWordsValues[currentWordIndex - 1];
			if (!prevWord) {
				throw new Error(
					`Expected to have prev word starting from "${currentPosition}", find none`,
				);
			}
			return prevWord.position;
		},
		[words],
	);
	return trpc.games.changeStateCurrentPosition.useMutation(
		useMutationHook({
			onMutate: (variables) =>
				changeGameStateWordPositionCache((prevPosition) =>
					getNextPosition(prevPosition, variables.direction),
				),
			revert: revertGameCache,
		}),
	);
};

export const useSubscribeToWordPositionChange = () => {
	const [changeGameStateWordPositionCache] =
		useChangeGameStateWordPositionCache();
	return usePusher(
		"game:currentPosition",
		React.useCallback(
			({ currentPosition }) =>
				changeGameStateWordPositionCache(currentPosition),
			[changeGameStateWordPositionCache],
		),
	);
};
