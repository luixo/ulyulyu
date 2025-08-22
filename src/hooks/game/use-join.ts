import React from "react";

import { useMutation } from "@tanstack/react-query";

import { UserContext } from "~/contexts/user-id-context";
import type { UserId } from "~/db/database.gen";
import type { Game } from "~/hooks/use-game";
import { useSubscription } from "~/hooks/use-subscription";
import { useUpdateGameCache } from "~/hooks/use-update-cache";
import { useTRPC } from "~/utils/trpc";

const useAddTeamCache = () => {
  const [updateGameCache] = useUpdateGameCache();
  return React.useCallback(
    (teamId: UserId, team: Game["teams"][UserId]) =>
      updateGameCache((game) => ({
        ...game,
        teams: { ...game.teams, [teamId]: team },
      })),
    [updateGameCache],
  );
};

export const useJoinMutation = () => {
  const trpc = useTRPC();
  const { id: selfUserId } = React.use(UserContext);
  const [, invalidateGameCache] = useUpdateGameCache();
  const addTeamCache = useAddTeamCache();
  return useMutation(
    trpc.teams.join.mutationOptions({
      onMutate: (variables) =>
        addTeamCache(selfUserId, {
          nickname: variables.nickname,
          ready: false,
        }),
      onError: () => invalidateGameCache(),
    }),
  );
};

export const useSubscribeToJoin = () => {
  const addTeamCache = useAddTeamCache();
  return useSubscription(
    "team:join",
    React.useCallback(
      ({ userId, nickname }) =>
        addTeamCache(userId, { nickname, ready: false }),
      [addTeamCache],
    ),
  );
};
