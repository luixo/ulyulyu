import React from "react";

import { UsersId, WordsId } from "@/db/models";
import { useGame } from "@/hooks/use-game";
import { useMutationHook } from "@/hooks/use-mutation-hook";
import { usePusher } from "@/hooks/use-pusher";
import {
	useUpdateGameCache,
	useUpdatePlayerDefinitionsCache,
	useUpdateAdminDefinitionsCache,
} from "@/hooks/use-update-cache";
import { trpc } from "@/lib/trpc";

const useChangeDefsPlayerWordDefinitionCache = () => {
	const [updatePlayerDefinitionsCache, revertPlayerDefinitionsCache] =
		useUpdatePlayerDefinitionsCache();
	return [
		React.useCallback(
			(wordId: WordsId, definition: string | null) =>
				updatePlayerDefinitionsCache(
					(defs) => void (defs[wordId].definition = definition),
				),
			[updatePlayerDefinitionsCache],
		),
		revertPlayerDefinitionsCache,
	] as const;
};

const useChangeGameWordDefinition = () => {
	const [updateGameCache, revertGameCache] = useUpdateGameCache();
	return [
		React.useCallback(
			(wordId: WordsId, definition: string | null) =>
				updateGameCache(
					(game) => void (game.words[wordId].definition = definition || ""),
				),
			[updateGameCache],
		),
		revertGameCache,
	] as const;
};

const useChangeDefsAdminReadinessCache = () => {
	const [updateAdminDefinitionsCache, revertAdminDefinitionsCache] =
		useUpdateAdminDefinitionsCache();
	return [
		React.useCallback(
			(wordId: WordsId, teamId: UsersId, ready: boolean) =>
				updateAdminDefinitionsCache(
					(definitions) => void (definitions[wordId][teamId] = ready),
				),
			[updateAdminDefinitionsCache],
		),
		revertAdminDefinitionsCache,
	] as const;
};

const useChangeDefsPlayerWordReadinessCache = () => {
	const [updatePlayerDefinitionsCache, revertPlayerDefinitionsCache] =
		useUpdatePlayerDefinitionsCache();
	return [
		React.useCallback(
			(wordId: WordsId, teamId: UsersId, ready: boolean) =>
				updatePlayerDefinitionsCache(
					(definitions) => void (definitions[wordId].readiness[teamId] = ready),
				),
			[updatePlayerDefinitionsCache],
		),
		revertPlayerDefinitionsCache,
	] as const;
};

export const useUpdateDefinitionMutation = () => {
	const [
		changeDefsPlayerWordDefinitionCache,
		revertDefsPlayerWordDefinitionCache,
	] = useChangeDefsPlayerWordDefinitionCache();
	const [changeGameWordDefinition, revertGameWordDefinition] =
		useChangeGameWordDefinition();
	return trpc.definitions.put.useMutation(
		useMutationHook([
			{
				getKey: (variables) => variables.wordId,
				onMutate: (variables) =>
					changeGameWordDefinition(variables.wordId, variables.definition),
				revert: revertGameWordDefinition,
			},
			{
				getKey: (variables) => variables.wordId,
				onMutate: (variables) =>
					changeDefsPlayerWordDefinitionCache(
						variables.wordId,
						variables.definition,
					),
				revert: revertDefsPlayerWordDefinitionCache,
			},
		]),
	);
};

export const useSubscribeToDefinitionReady = () => {
	const { isOwner } = useGame();
	const [changeDefsPlayerWordReadinessCache] =
		useChangeDefsPlayerWordReadinessCache();
	const [changeDefsAdminReadinessCache] = useChangeDefsAdminReadinessCache();
	return usePusher(
		"definition:ready",
		React.useCallback(
			({ wordId, teamId, ready }) => {
				if (isOwner) {
					changeDefsAdminReadinessCache(wordId, teamId, ready);
				} else {
					changeDefsPlayerWordReadinessCache(wordId, teamId, ready);
				}
			},
			[
				changeDefsAdminReadinessCache,
				changeDefsPlayerWordReadinessCache,
				isOwner,
			],
		),
	);
};
