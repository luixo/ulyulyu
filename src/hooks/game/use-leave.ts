import React from "react";

import { useMutation } from "@tanstack/react-query";
import { omit } from "remeda";

import { UserContext } from "~/contexts/user-id-context";
import type { UserId } from "~/db/database.gen";
import { useSubscription } from "~/hooks/use-subscription";
import { useUpdateGameCache } from "~/hooks/use-update-cache";
import { useTRPC } from "~/utils/trpc";

const useRemoveTeamCache = () => {
  const [updateGameCache] = useUpdateGameCache();
  return React.useCallback(
    (teamId: UserId) =>
      updateGameCache((game) => ({
        ...game,
        teams: omit(game.teams, [teamId]),
      })),
    [updateGameCache],
  );
};

export const useLeaveMutation = () => {
  const trpc = useTRPC();
  const { id: selfUserId } = React.use(UserContext);
  const removeTeamCache = useRemoveTeamCache();
  const [, invalidateGameCache] = useUpdateGameCache();
  return useMutation(
    trpc.teams.leave.mutationOptions({
      onMutate: () => removeTeamCache(selfUserId),
      onError: () => invalidateGameCache(),
    }),
  );
};

export const useKickMutation = () => {
  const trpc = useTRPC();
  const removeTeamCache = useRemoveTeamCache();
  const [, invalidateGameCache] = useUpdateGameCache();
  return useMutation(
    trpc.teams.kick.mutationOptions({
      onMutate: (variables) => removeTeamCache(variables.teamId),
      onError: () => invalidateGameCache(),
    }),
  );
};

export const useSubscribeToLeave = () => {
  const removeTeamCache = useRemoveTeamCache();
  return useSubscription(
    "team:leave",
    React.useCallback(
      ({ userId }) => removeTeamCache(userId),
      [removeTeamCache],
    ),
  );
};
