import React from "react";

import { UsersId, WordsId } from "@/db/models";
import { useGame } from "@/hooks/use-game";
import { useMutationHook } from "@/hooks/use-mutation-hook";
import { usePusher } from "@/hooks/use-pusher";
import { useSelfUserId } from "@/hooks/use-self-user-id";
import {
	useUpdateAdminGuessingCache,
	useUpdatePlayerGuessingCache,
} from "@/hooks/use-update-cache";
import { trpc } from "@/lib/trpc";

const useChangeGuessPlayerReadyCache = () => {
	const [updatePlayerGuessingCache, revertPlayerGuessingCache] =
		useUpdatePlayerGuessingCache();
	return [
		React.useCallback(
			(wordId: WordsId, teamId: UsersId, ready: boolean) =>
				updatePlayerGuessingCache(
					(defs) => void (defs[wordId].readiness[teamId] = ready),
				),
			[updatePlayerGuessingCache],
		),
		revertPlayerGuessingCache,
	] as const;
};

const useChangeGuessPlayerVoteCache = () => {
	const [updatePlayerGuessingCache, revertPlayerGuessingCache] =
		useUpdatePlayerGuessingCache();
	return [
		React.useCallback(
			(wordId: WordsId, vote: string | null) =>
				updatePlayerGuessingCache((defs) => void (defs[wordId].vote = vote)),
			[updatePlayerGuessingCache],
		),
		revertPlayerGuessingCache,
	] as const;
};

const useChangeGuessAdminReadyCache = () => {
	const [updateAdminGuessingCache] = useUpdateAdminGuessingCache();
	return [
		React.useCallback(
			(wordId: WordsId, teamId: UsersId, ready: boolean) =>
				updateAdminGuessingCache(
					(defs) => void (defs[wordId].readiness[teamId] = ready),
				),
			[updateAdminGuessingCache],
		),
	] as const;
};

export const useVoteMutation = () => {
	const selfUserId = useSelfUserId();
	const [changeGuessPlayerReadyCache, revertGuessPlayerReadyCache] =
		useChangeGuessPlayerReadyCache();
	const [changeGuessPlayerVoteCache, revertGuessPlayerVoteCache] =
		useChangeGuessPlayerVoteCache();
	return trpc.definitions.vote.useMutation(
		useMutationHook([
			{
				getKey: (variables) => variables.wordId,
				onMutate: (variables) =>
					changeGuessPlayerReadyCache(variables.wordId, selfUserId, true),
				revert: revertGuessPlayerReadyCache,
			},
			{
				getKey: (variables) => variables.wordId,
				onMutate: (variables) =>
					changeGuessPlayerVoteCache(variables.wordId, variables.guessUserId),
				revert: revertGuessPlayerVoteCache,
			},
		]),
	);
};

export const useSubscribeToTeamVoted = () => {
	const { isOwner } = useGame();
	const [changeGuessPlayerReadyCache] = useChangeGuessPlayerReadyCache();
	const [changeGuessAdminReadyCache] = useChangeGuessAdminReadyCache();

	return usePusher(
		"guessing:ready",
		React.useCallback(
			({ wordId, teamId, ready }) => {
				if (isOwner) {
					changeGuessAdminReadyCache(wordId, teamId, ready);
				} else {
					changeGuessPlayerReadyCache(wordId, teamId, ready);
				}
			},
			[changeGuessPlayerReadyCache, changeGuessAdminReadyCache, isOwner],
		),
	);
};
