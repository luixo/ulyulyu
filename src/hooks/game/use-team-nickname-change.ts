import React from "react";

import { useMutation } from "@tanstack/react-query";
import { useEventCallback } from "usehooks-ts";

import { UserContext } from "~/contexts/user-id-context";
import { useGame } from "~/hooks/use-game";
import { useSubscription } from "~/hooks/use-subscription";
import { useInvalidateCache, useUpdateCache } from "~/hooks/use-update-cache";
import type { UserId } from "~/server/validation";
import { useTRPC } from "~/utils/trpc";

const useChangeTeamNicknameCache = () => {
  const trpc = useTRPC();
  const { id } = useGame();
  const updateGameCache = useUpdateCache(trpc.games.get.queryFilter({ id }));
  return useEventCallback((teamId: UserId, nickname: string) =>
    updateGameCache((game) => ({
      ...game,
      teams: game.teams[teamId]
        ? {
            ...game.teams,
            [teamId]: { ...game.teams[teamId], nickname },
          }
        : game.teams,
    })),
  );
};

export const useTeamNicknameChangeMutation = () => {
  const trpc = useTRPC();
  const [{ id: selfUserId }] = React.use(UserContext);
  const changeTeamNicknameCache = useChangeTeamNicknameCache();
  const { id } = useGame();
  const invalidateGameCache = useInvalidateCache(
    trpc.games.get.queryFilter({ id }),
  );
  return useMutation(
    trpc.teams.changeNickname.mutationOptions({
      onMutate: (variables) =>
        changeTeamNicknameCache(selfUserId, variables.nickname),
      onError: () => invalidateGameCache(),
    }),
  );
};

export const useSubscribeToTeamNicknameChange = () => {
  const changeTeamNicknameCache = useChangeTeamNicknameCache();
  return useSubscription(
    "team:nickname",
    useEventCallback(({ userId, nickname }) =>
      changeTeamNicknameCache(userId, nickname),
    ),
  );
};
