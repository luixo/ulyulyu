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

export const useStartGameMutation = () => {
	const { firstWordPosition } = useWordPositions();
	const [changeGameStateCache, revertGameCache] = useChangeGameStateCache();
	return trpc.games.start.useMutation(
		useMutationHook({
			onMutate: () =>
				changeGameStateCache({
					phase: "proposal",
					currentPosition: firstWordPosition,
				}),
			revert: revertGameCache,
		}),
	);
};

export const useSubscribeToGameStart = () => {
	const { teams } = useGame();
	const { firstWordPosition } = useWordPositions();
	const trpcUtils = trpc.useUtils();
	const [changeGameStateCache] = useChangeGameStateCache();
	return usePusher(
		"game:start",
		React.useCallback(
			({ teamIds }) => {
				const expectedTeamIds = teamIds.toSorted();
				const actualTeamIds = Object.keys(teams).toSorted();
				if (
					expectedTeamIds.length !== actualTeamIds.length ||
					actualTeamIds.some(
						(teamId, index) => teamId !== expectedTeamIds[index],
					)
				) {
					void trpcUtils.games.get.invalidate();
				}
				changeGameStateCache({
					phase: "proposal",
					currentPosition: firstWordPosition,
				});
			},
			[changeGameStateCache, firstWordPosition, teams, trpcUtils.games.get],
		),
	);
};
