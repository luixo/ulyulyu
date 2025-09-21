import React from "react";

import { useMutation } from "@tanstack/react-query";
import { omit } from "remeda";
import { useEventCallback } from "usehooks-ts";

import { UserContext } from "~/contexts/user-id-context";
import { useGame } from "~/hooks/use-game";
import { useSubscription } from "~/hooks/use-subscription";
import { useInvalidateCache, useUpdateCache } from "~/hooks/use-update-cache";
import type { UserId } from "~/server/validation";
import { useTRPC } from "~/utils/trpc";

const useRemoveTeamCache = () => {
  const trpc = useTRPC();
  const { id } = useGame();
  const updateGameCache = useUpdateCache(trpc.games.get.queryFilter({ id }));
  return useEventCallback((teamId: UserId) =>
    updateGameCache((game) => ({
      ...game,
      teams: omit(game.teams, [teamId]),
    })),
  );
};

export const useLeaveMutation = () => {
  const trpc = useTRPC();
  const { id: selfUserId } = React.use(UserContext);
  const removeTeamCache = useRemoveTeamCache();
  const { id } = useGame();
  const invalidateGameCache = useInvalidateCache(
    trpc.games.get.queryFilter({ id }),
  );
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
  const { id } = useGame();
  const invalidateGameCache = useInvalidateCache(
    trpc.games.get.queryFilter({ id }),
  );
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
    useEventCallback(({ userId }) => removeTeamCache(userId)),
  );
};
