import React from "react";

import { useMutation } from "@tanstack/react-query";

import { UserContext } from "~/contexts/user-id-context";
import type { UserId } from "~/db/database.gen";
import { useSubscription } from "~/hooks/use-subscription";
import { useUpdateGameCache } from "~/hooks/use-update-cache";
import { useTRPC } from "~/utils/trpc";

const useChangeTeamReadinessCache = () => {
  const [updateGameCache] = useUpdateGameCache();
  return React.useCallback(
    (teamId: UserId, ready: boolean) =>
      updateGameCache((game) => ({
        ...game,
        teams: game.teams[teamId]
          ? {
              ...game.teams,
              [teamId]: { ...game.teams[teamId], ready },
            }
          : game.teams,
      })),
    [updateGameCache],
  );
};

export const useTeamReadinessChangeMutation = () => {
  const trpc = useTRPC();
  const { id: selfUserId } = React.use(UserContext);
  const changeTeamReadinessCache = useChangeTeamReadinessCache();
  const [, invalidateGameCache] = useUpdateGameCache();
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
    React.useCallback(
      ({ userId, ready }) => changeTeamReadinessCache(userId, ready),
      [changeTeamReadinessCache],
    ),
  );
};
