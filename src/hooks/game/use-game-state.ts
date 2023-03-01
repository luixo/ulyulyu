import React from "react";

import { useWordPositions } from "@/hooks/game/use-word-positions";
import { Game, useGame } from "@/hooks/use-game";
import { useMutationHook } from "@/hooks/use-mutation-hook";
import { usePusher } from "@/hooks/use-pusher";
import { useUpdateGameCache } from "@/hooks/use-update-cache";
import { trpc } from "@/lib/trpc";

type State = Game["state"];

const useChangeGameStateCache = () => {
	const [updateGameCache, revertGameCache] = useUpdateGameCache();
	return [
		React.useCallback(
			(nextState: State) =>
				updateGameCache((game) => {
					game.state = nextState;
				}),
			[updateGameCache],
		),
		revertGameCache,
	] as const;
};

export const useGameStateMutation = () => {
	const { state: currentState } = useGame();
	const [changeGameStateCache, revertGameCache] = useChangeGameStateCache();
	const { firstWordPosition, lastWordPosition } = useWordPositions();
	return trpc.games.changeState.useMutation(
		useMutationHook({
			onMutate: (variables) => {
				switch (variables.direction) {
					case "forward": {
						switch (currentState.phase) {
							case "start":
								return changeGameStateCache({
									phase: "proposal",
									currentPosition: firstWordPosition,
								});
							case "proposal":
								return changeGameStateCache({
									phase: "guessing",
									currentPosition: firstWordPosition,
								});
							case "guessing":
								return changeGameStateCache({ phase: "finish" });
							case "finish":
								break;
						}
						break;
					}
					case "backward": {
						switch (currentState.phase) {
							case "start":
								return;
							case "proposal":
								return changeGameStateCache({
									phase: "start",
								});
							case "guessing":
								return changeGameStateCache({
									phase: "proposal",
									currentPosition: lastWordPosition,
								});
							case "finish":
								return changeGameStateCache({
									phase: "guessing",
									currentPosition: lastWordPosition,
								});
						}
					}
				}
			},
			revert: revertGameCache,
		}),
	);
};

export const useSubscribeToGameState = () => {
	const [changeGameStateCache] = useChangeGameStateCache();
	return usePusher(
		"game:state",
		React.useCallback(
			({ state }) => changeGameStateCache(state),
			[changeGameStateCache],
		),
	);
};
