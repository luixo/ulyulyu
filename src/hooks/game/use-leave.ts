import React from "react";

import { UsersId } from "@/db/models";
import { useMutationHook } from "@/hooks/use-mutation-hook";
import { usePusher } from "@/hooks/use-pusher";
import { useSelfUserId } from "@/hooks/use-self-user-id";
import { useUpdateGameCache } from "@/hooks/use-update-cache";
import { trpc } from "@/lib/trpc";

const useRemoveTeamCache = () => {
	const [updateGameCache, revertGameCache] = useUpdateGameCache();
	return [
		React.useCallback(
			(teamId: UsersId) =>
				updateGameCache((game) => {
					delete game.teams[teamId];
				}),
			[updateGameCache],
		),
		revertGameCache,
	] as const;
};

export const useLeaveMutation = () => {
	const selfUserId = useSelfUserId();
	const [removeTeamCache, revertTeamCache] = useRemoveTeamCache();
	return trpc.teams.leave.useMutation(
		useMutationHook({
			getKey: () => selfUserId,
			onMutate: () => removeTeamCache(selfUserId),
			revert: revertTeamCache,
		}),
	);
};

export const useKickMutation = () => {
	const [removeTeamCache, revertTeamCache] = useRemoveTeamCache();
	return trpc.teams.kick.useMutation(
		useMutationHook({
			getKey: (variables) => variables.teamId,
			onMutate: (variables) => removeTeamCache(variables.teamId),
			revert: revertTeamCache,
		}),
	);
};

export const useSubscribeToLeave = () => {
	const [removeTeamCache] = useRemoveTeamCache();
	return usePusher(
		"team:leave",
		React.useCallback(
			({ userId }) => removeTeamCache(userId),
			[removeTeamCache],
		),
	);
};
