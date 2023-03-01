import React from "react";

import { UsersId } from "@/db/models";
import { useMutationHook } from "@/hooks/use-mutation-hook";
import { usePusher } from "@/hooks/use-pusher";
import { useSelfUserId } from "@/hooks/use-self-user-id";
import { useUpdateGameCache } from "@/hooks/use-update-cache";
import { trpc } from "@/lib/trpc";

const useChangeTeamReadinessCache = () => {
	const [updateGameCache, revertGameCache] = useUpdateGameCache();
	return [
		React.useCallback(
			(teamId: UsersId, ready: boolean) =>
				updateGameCache((game) => void (game.teams[teamId].ready = ready)),
			[updateGameCache],
		),
		revertGameCache,
	] as const;
};

export const useTeamReadinessChangeMutation = () => {
	const selfUserId = useSelfUserId();
	const [changeTeamReadinessCache, revertTeamReadinessCache] =
		useChangeTeamReadinessCache();
	return trpc.teams.changeReadiness.useMutation(
		useMutationHook({
			getKey: () => selfUserId,
			onMutate: (variables) =>
				changeTeamReadinessCache(selfUserId, variables.ready),
			revert: revertTeamReadinessCache,
		}),
	);
};

export const useSubscribeToTeamReadyChange = () => {
	const [changeTeamReadinessCache] = useChangeTeamReadinessCache();
	return usePusher(
		"team:readiness",
		React.useCallback(
			({ userId, ready }) => changeTeamReadinessCache(userId, ready),
			[changeTeamReadinessCache],
		),
	);
};
