import React from "react";

import { useMutation } from "@tanstack/react-query";
import { useEventCallback } from "usehooks-ts";

import { useGame } from "~/hooks/use-game";
import { useSubscription } from "~/hooks/use-subscription";
import { useInvalidateCache, useUpdateCache } from "~/hooks/use-update-cache";
import type { UserId, WordId } from "~/server/validation";
import { useTRPC } from "~/utils/trpc";

const useChangeDefsPlayerWordDefinitionCache = () => {
  const trpc = useTRPC();
  const { id: gameId } = useGame();
  const updatePlayerDefinitionsCache = useUpdateCache(
    trpc.definitions.getPlayer.queryFilter({ gameId }),
  );
  return useEventCallback((wordId: WordId, definition: string | null) =>
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
  );
};

const useChangeGameWordDefinition = () => {
  const trpc = useTRPC();
  const { id } = useGame();
  const updateGameCache = useUpdateCache(trpc.games.get.queryFilter({ id }));
  return useEventCallback((wordId: WordId, definition: string | null) =>
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
  );
};

const useChangeDefsAdminReadinessCache = () => {
  const trpc = useTRPC();
  const { id: gameId } = useGame();
  const updateAdminDefinitionsCache = useUpdateCache(
    trpc.definitions.getAdmin.queryFilter({ gameId }),
  );
  return useEventCallback((wordId: WordId, teamId: UserId, ready: boolean) =>
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
  );
};

const useChangeDefsPlayerWordReadinessCache = () => {
  const trpc = useTRPC();
  const { id: gameId } = useGame();
  const updatePlayerDefinitionsCache = useUpdateCache(
    trpc.definitions.getPlayer.queryFilter({ gameId }),
  );
  return useEventCallback((wordId: WordId, teamId: UserId, ready: boolean) =>
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
  );
};

export const useUpdateDefinitionMutation = () => {
  const trpc = useTRPC();
  const { id } = useGame();
  const changeDefsPlayerWordDefinitionCache =
    useChangeDefsPlayerWordDefinitionCache();
  const invalidatePlayerDefinitionsCache = useInvalidateCache(
    trpc.definitions.getPlayer.queryFilter({ gameId: id }),
  );
  const changeGameWordDefinition = useChangeGameWordDefinition();
  const invalidateGameCache = useInvalidateCache(
    trpc.games.get.queryFilter({ id }),
  );
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
    useEventCallback(({ wordId, teamId, ready }) => {
      if (isOwner) {
        changeDefsAdminReadinessCache(wordId, teamId, ready);
      } else {
        changeDefsPlayerWordReadinessCache(wordId, teamId, ready);
      }
    }),
  );
};
