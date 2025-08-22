import React from "react";

import { useMutation } from "@tanstack/react-query";

import type { UserId, WordId } from "~/db/database.gen";
import { useGame } from "~/hooks/use-game";
import { useSubscription } from "~/hooks/use-subscription";
import {
  useUpdateAdminDefinitionsCache,
  useUpdateGameCache,
  useUpdatePlayerDefinitionsCache,
} from "~/hooks/use-update-cache";
import { useTRPC } from "~/utils/trpc";

const useChangeDefsPlayerWordDefinitionCache = () => {
  const [updatePlayerDefinitionsCache] = useUpdatePlayerDefinitionsCache();
  return React.useCallback(
    (wordId: WordId, definition: string | null) =>
      updatePlayerDefinitionsCache((defs) =>
        defs[wordId]
          ? {
              ...defs,
              [wordId]: {
                ...defs[wordId],
                definition,
              },
            }
          : defs,
      ),
    [updatePlayerDefinitionsCache],
  );
};

const useChangeGameWordDefinition = () => {
  const [updateGameCache] = useUpdateGameCache();
  return React.useCallback(
    (wordId: WordId, definition: string | null) =>
      updateGameCache((game) => ({
        ...game,
        words: game.words[wordId]
          ? {
              ...game.words,
              [wordId]: {
                ...game.words[wordId],
                definition: definition || "",
              },
            }
          : game.words,
      })),
    [updateGameCache],
  );
};

const useChangeDefsAdminReadinessCache = () => {
  const [updateAdminDefinitionsCache] = useUpdateAdminDefinitionsCache();
  return React.useCallback(
    (wordId: WordId, teamId: UserId, ready: boolean) =>
      updateAdminDefinitionsCache((definitions) =>
        definitions[wordId]
          ? {
              ...definitions,
              [wordId]: {
                ...definitions[wordId],
                [teamId]: ready,
              },
            }
          : definitions,
      ),
    [updateAdminDefinitionsCache],
  );
};

const useChangeDefsPlayerWordReadinessCache = () => {
  const [updatePlayerDefinitionsCache] = useUpdatePlayerDefinitionsCache();
  return React.useCallback(
    (wordId: WordId, teamId: UserId, ready: boolean) =>
      updatePlayerDefinitionsCache((definitions) =>
        definitions[wordId]
          ? {
              ...definitions,
              [wordId]: {
                ...definitions[wordId],
                readiness: {
                  ...definitions[wordId].readiness,
                  [teamId]: ready,
                },
              },
            }
          : definitions,
      ),
    [updatePlayerDefinitionsCache],
  );
};

export const useUpdateDefinitionMutation = () => {
  const trpc = useTRPC();
  const changeDefsPlayerWordDefinitionCache =
    useChangeDefsPlayerWordDefinitionCache();
  const [, invalidatePlayerDefinitionsCache] =
    useUpdatePlayerDefinitionsCache();
  const changeGameWordDefinition = useChangeGameWordDefinition();
  const [, invalidateGameCache] = useUpdateGameCache();
  return useMutation(
    trpc.definitions.put.mutationOptions({
      onMutate: (variables) => {
        changeGameWordDefinition(variables.wordId, variables.definition);
        changeDefsPlayerWordDefinitionCache(
          variables.wordId,
          variables.definition,
        );
      },
      onError: () => {
        invalidateGameCache();
        invalidatePlayerDefinitionsCache();
      },
    }),
  );
};

export const useSubscribeToDefinitionReady = () => {
  const { isOwner } = useGame();
  const changeDefsPlayerWordReadinessCache =
    useChangeDefsPlayerWordReadinessCache();
  const changeDefsAdminReadinessCache = useChangeDefsAdminReadinessCache();
  return useSubscription(
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
