import { useMutation } from "@tanstack/react-query";
import { useEventCallback } from "usehooks-ts";
import { useWordPositions } from "~/hooks/game/use-word-positions";
import type { Game } from "~/hooks/use-game";
import { useGame } from "~/hooks/use-game";
import { useSubscription } from "~/hooks/use-subscription";
import { useInvalidateCache, useUpdateCache } from "~/hooks/use-update-cache";
import { useTRPC } from "~/utils/trpc";

export const useChangeGameStateCache = () => {
	const trpc = useTRPC();
	const { id } = useGame();
	const updateGameCache = useUpdateCache(trpc.games.get.queryFilter({ id }));
	return useEventCallback((nextState: Game["state"]) =>
		updateGameCache((game) => ({ ...game, state: nextState })),
	);
};

export const useGameStateMutation = () => {
	const trpc = useTRPC();
	const { state: currentState, id } = useGame();
	const invalidateGameCache = useInvalidateCache(
		trpc.games.get.queryFilter({ id }),
	);
	const changeGameStateCache = useChangeGameStateCache();
	const { firstWordPosition, lastWordPosition } = useWordPositions();
	return useMutation(
		trpc.games.changeState.mutationOptions({
			onError: () => invalidateGameCache(),
			onMutate: (variables) => {
				switch (variables.direction) {
					case "forward": {
						switch (currentState.phase) {
							case "start": {
								return changeGameStateCache({
									currentPosition: firstWordPosition,
									phase: "proposal",
								});
							}
							case "proposal": {
								return changeGameStateCache({
									currentPosition: firstWordPosition,
									phase: "guessing",
								});
							}
							case "guessing": {
								return changeGameStateCache({ phase: "finish" });
							}
							case "finish": {
								break;
							}
						}
						break;
					}
					case "backward": {
						switch (currentState.phase) {
							case "start": {
								return;
							}
							case "proposal": {
								return changeGameStateCache({
									phase: "start",
								});
							}
							case "guessing": {
								return changeGameStateCache({
									currentPosition: lastWordPosition,
									phase: "proposal",
								});
							}
							case "finish": {
								return changeGameStateCache({
									currentPosition: lastWordPosition,
									phase: "guessing",
								});
							}
						}
					}
				}
			},
		}),
	);
};

export const useSubscribeToGameState = () => {
	const changeGameStateCache = useChangeGameStateCache();
	return useSubscription(
		"game:state",
		useEventCallback(({ state }) => {
			changeGameStateCache(state);
		}),
	);
};
