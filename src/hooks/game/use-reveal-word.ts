import React from "react";

import { WordsId } from "@/db/models";
import { useGame } from "@/hooks/use-game";
import { usePusher } from "@/hooks/use-pusher";
import {
	useUpdateAdminGuessingCache,
	useUpdatePlayerGuessingCache,
} from "@/hooks/use-update-cache";
import { trpc } from "@/lib/trpc";
import { PusherMapping } from "@/types/pusher";

const useChangeGuessAdminWordRevealMapCache = () => {
	const [updateAdminGuessingCache, revertAdminGuessingCache] =
		useUpdateAdminGuessingCache();
	return [
		React.useCallback(
			(
				wordId: WordsId,
				revealMap: PusherMapping["guessing:reveal"]["mapping"],
			) =>
				updateAdminGuessingCache(
					(defs) => void (defs[wordId].revealMap = revealMap),
				),
			[updateAdminGuessingCache],
		),
		revertAdminGuessingCache,
	] as const;
};

const useChangeGuessPlayerWordRevealMapCache = () => {
	const [updatePlayerGuessingCache, revertPlayerGuessingCache] =
		useUpdatePlayerGuessingCache();
	return [
		React.useCallback(
			(
				wordId: WordsId,
				revealMap: PusherMapping["guessing:reveal"]["mapping"],
			) =>
				updatePlayerGuessingCache(
					(defs) => void (defs[wordId].revealMap = revealMap),
				),
			[updatePlayerGuessingCache],
		),
		revertPlayerGuessingCache,
	] as const;
};

export const useRevealWordMutation = () =>
	trpc.definitions.reveal.useMutation();

export const useSubscribeToWordReveal = () => {
	const { isOwner } = useGame();
	const [changeGuessAdminWordRevealMapCache] =
		useChangeGuessAdminWordRevealMapCache();
	const [changeGuessPlayerWordRevealMapCache] =
		useChangeGuessPlayerWordRevealMapCache();
	return usePusher(
		"guessing:reveal",
		React.useCallback(
			({ wordId, mapping }) => {
				if (isOwner) {
					changeGuessAdminWordRevealMapCache(wordId, mapping);
				} else {
					changeGuessPlayerWordRevealMapCache(wordId, mapping);
				}
			},
			[
				changeGuessAdminWordRevealMapCache,
				changeGuessPlayerWordRevealMapCache,
				isOwner,
			],
		),
	);
};
