import React from "react";

import { useMutation } from "@tanstack/react-query";
import { useEventCallback } from "usehooks-ts";

import { UserContext } from "~/contexts/user-id-context";
import { useGame } from "~/hooks/use-game";
import { useSubscription } from "~/hooks/use-subscription";
import { useInvalidateCache, useUpdateCache } from "~/hooks/use-update-cache";
import type { UserId } from "~/server/validation";
import { useTRPC } from "~/utils/trpc";

const useChangeTeamReadinessCache = () => {
  const trpc = useTRPC();
  const { id } = useGame();
  const updateGameCache = useUpdateCache(trpc.games.get.queryFilter({ id }));
  return useEventCallback((teamId: UserId, ready: boolean) =>
    updateGameCache((game) => ({
      ...game,
      teams: game.teams[teamId]
        ? {
            ...game.teams,
            [teamId]: { ...game.teams[teamId], ready },
          }
        : game.teams,
    })),
  );
};

export const useTeamReadinessChangeMutation = () => {
  const trpc = useTRPC();
  const { id: selfUserId } = React.use(UserContext);
  const changeTeamReadinessCache = useChangeTeamReadinessCache();
  const { id } = useGame();
  const invalidateGameCache = useInvalidateCache(
    trpc.games.get.queryFilter({ id }),
  );
  return useMutation(
    trpc.teams.changeReadiness.mutationOptions({
      onMutate: (variables) =>
        changeTeamReadinessCache(selfUserId, variables.ready),
      onError: () => invalidateGameCache(),
    }),
  );
};

export const useSubscribeToTeamReadyChange = () => {
  const changeTeamReadinessCache = useChangeTeamReadinessCache();
  return useSubscription(
    "team:readiness",
    useEventCallback(({ userId, ready }) =>
      changeTeamReadinessCache(userId, ready),
    ),
  );
};
