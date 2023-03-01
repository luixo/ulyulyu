import React from "react";

import { UsersId } from "@/db/models";
import { useMutationHook } from "@/hooks/use-mutation-hook";
import { usePusher } from "@/hooks/use-pusher";
import { useSelfUserId } from "@/hooks/use-self-user-id";
import { useUpdateGameCache } from "@/hooks/use-update-cache";
import { trpc } from "@/lib/trpc";

const useChangeTeamNicknameCache = () => {
	const [updateGameCache, revertGameCache] = useUpdateGameCache();
	return [
		React.useCallback(
			(teamId: UsersId, nickname: string) =>
				updateGameCache(
					(game) => void (game.teams[teamId].nickname = nickname),
				),
			[updateGameCache],
		),
		revertGameCache,
	] as const;
};

export const useTeamNicknameChangeMutation = () => {
	const selfUserId = useSelfUserId();
	const [changeTeamNicknameCache, revertTeamNicknameCache] =
		useChangeTeamNicknameCache();
	return trpc.teams.changeNickname.useMutation(
		useMutationHook({
			getKey: () => selfUserId,
			onMutate: (variables) =>
				changeTeamNicknameCache(selfUserId, variables.nickname),
			revert: revertTeamNicknameCache,
		}),
	);
};

export const useSubscribeToTeamNicknameChange = () => {
	const [changeTeamNicknameCache] = useChangeTeamNicknameCache();
	return usePusher(
		"team:nickname",
		React.useCallback(
			({ userId, nickname }) => changeTeamNicknameCache(userId, nickname),
			[changeTeamNicknameCache],
		),
	);
};
