import React from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { keys } from "remeda";

import { useChangeGameStateCache } from "~/hooks/game/use-game-state";
import { useWordPositions } from "~/hooks/game/use-word-positions";
import { useGame } from "~/hooks/use-game";
import { useSubscription } from "~/hooks/use-subscription";
import { useUpdateGameCache } from "~/hooks/use-update-cache";
import { useTRPC } from "~/utils/trpc";

export const useStartGameMutation = () => {
  const trpc = useTRPC();
  const { firstWordPosition } = useWordPositions();
  const changeGameStateCache = useChangeGameStateCache();
  const [, invalidateGameCache] = useUpdateGameCache();
  return useMutation(
    trpc.games.start.mutationOptions({
      onMutate: () =>
        changeGameStateCache({
          phase: "proposal",
          currentPosition: firstWordPosition,
        }),
      onError: () => invalidateGameCache(),
    }),
  );
};

export const useSubscribeToGameStart = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { teams, id } = useGame();
  const { firstWordPosition } = useWordPositions();
  const changeGameStateCache = useChangeGameStateCache();
  const gameFilter = trpc.games.get.queryFilter({ id });
  return useSubscription(
    "game:start",
    React.useCallback(
      ({ teamIds }) => {
        const expectedTeamIds = teamIds.toSorted();
        const actualTeamIds = keys(teams).toSorted();
        if (
          expectedTeamIds.length !== actualTeamIds.length ||
          actualTeamIds.some(
            (teamId, index) => teamId !== expectedTeamIds[index],
          )
        ) {
          queryClient.invalidateQueries(gameFilter);
        }
        changeGameStateCache({
          phase: "proposal",
          currentPosition: firstWordPosition,
        });
      },
      [changeGameStateCache, firstWordPosition, gameFilter, queryClient, teams],
    ),
  );
};
