import React from "react";

import { UsersId } from "@/db/models";
import { Game } from "@/hooks/use-game";
import { useMutationHook } from "@/hooks/use-mutation-hook";
import { usePusher } from "@/hooks/use-pusher";
import { useSelfUserId } from "@/hooks/use-self-user-id";
import { useUpdateGameCache } from "@/hooks/use-update-cache";
import { trpc } from "@/lib/trpc";

type Team = Game["teams"][UsersId];

const useAddTeamCache = () => {
	const [updateGameCache, revertGameCache] = useUpdateGameCache();
	return [
		React.useCallback(
			(teamId: UsersId, team: Team) =>
				updateGameCache((game) => void (game.teams[teamId] = team)),
			[updateGameCache],
		),
		revertGameCache,
	] as const;
};

export const useJoinMutation = () => {
	const selfUserId = useSelfUserId();
	const [addTeamCache, revertTeamCache] = useAddTeamCache();
	return trpc.teams.join.useMutation(
		useMutationHook({
			getKey: () => selfUserId,
			onMutate: (variables) =>
				addTeamCache(selfUserId, {
					nickname: variables.nickname,
					ready: false,
				}),
			revert: revertTeamCache,
		}),
	);
};

export const useSubscribeToJoin = () => {
	const [addTeamCache] = useAddTeamCache();
	return usePusher(
		"team:join",
		React.useCallback(
			({ userId, nickname }) =>
				addTeamCache(userId, { nickname, ready: false }),
			[addTeamCache],
		),
	);
};
