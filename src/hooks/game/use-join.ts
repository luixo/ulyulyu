import React from "react";

import { useMutation } from "@tanstack/react-query";
import { useEventCallback } from "usehooks-ts";

import { UserContext } from "~/contexts/user-id-context";
import { type Game, useGame } from "~/hooks/use-game";
import { useSubscription } from "~/hooks/use-subscription";
import { useInvalidateCache, useUpdateCache } from "~/hooks/use-update-cache";
import type { UserId } from "~/server/validation";
import { useTRPC } from "~/utils/trpc";

const useAddTeamCache = () => {
  const trpc = useTRPC();
  const { id } = useGame();
  const updateGameCache = useUpdateCache(trpc.games.get.queryFilter({ id }));
  return useEventCallback((teamId: UserId, team: Game["teams"][UserId]) =>
    updateGameCache((game) => ({
      ...game,
      teams: { ...game.teams, [teamId]: team },
    })),
  );
};

export const useJoinMutation = () => {
  const trpc = useTRPC();
  const [{ id: selfUserId }] = React.use(UserContext);
  const { id } = useGame();
  const invalidateGameCache = useInvalidateCache(
    trpc.games.get.queryFilter({ id }),
  );
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
    useEventCallback(({ userId, nickname }) =>
      addTeamCache(userId, { nickname, ready: false }),
    ),
  );
};
