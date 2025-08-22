import type { SetStateAction } from "react";
import React from "react";

import { useMutation } from "@tanstack/react-query";
import { values } from "remeda";

import { useGame } from "~/hooks/use-game";
import { useSubscription } from "~/hooks/use-subscription";
import { useUpdateGameCache } from "~/hooks/use-update-cache";
import { updateSetStateAction } from "~/utils/react";
import { useTRPC } from "~/utils/trpc";

const useChangeGameStateWordPositionCache = () => {
  const [updateGameCache] = useUpdateGameCache();
  return React.useCallback(
    (positionAction: SetStateAction<number>) =>
      updateGameCache((game) => {
        if (
          game.state.phase !== "proposal" &&
          game.state.phase !== "guessing"
        ) {
          throw new Error(
            `Expected to change game word position only in proposal / guessing phase`,
          );
        }
        return {
          ...game,
          state: {
            ...game.state,
            currentPosition: updateSetStateAction(
              game.state.currentPosition,
              positionAction,
            ),
          },
        };
      }),
    [updateGameCache],
  );
};

export const useGameChangeWordPositionMutation = () => {
  const trpc = useTRPC();
  const { words } = useGame();
  const [, invalidateGameCache] = useUpdateGameCache();
  const changeGameStateWordPositionCache =
    useChangeGameStateWordPositionCache();
  const getNextPosition = React.useCallback(
    (currentPosition: number, direction: "forward" | "backward") => {
      const sortedWordsValues = values(words).sort(
        (a, b) => a.position - b.position,
      );
      const currentWordIndex = sortedWordsValues.findIndex(
        ({ position }) => position === currentPosition,
      );
      if (currentWordIndex === -1) {
        throw new Error(
          `Expected to have word with position "${currentPosition}"`,
        );
      }
      if (direction === "forward") {
        const nextWord = sortedWordsValues[currentWordIndex + 1];
        if (!nextWord) {
          throw new Error(
            `Expected to have next word starting from "${currentPosition}", find none`,
          );
        }
        return nextWord.position;
      }
      const prevWord = sortedWordsValues[currentWordIndex - 1];
      if (!prevWord) {
        throw new Error(
          `Expected to have prev word starting from "${currentPosition}", find none`,
        );
      }
      return prevWord.position;
    },
    [words],
  );
  return useMutation(
    trpc.games.changeStateCurrentPosition.mutationOptions({
      onMutate: (variables) =>
        changeGameStateWordPositionCache((prevPosition) =>
          getNextPosition(prevPosition, variables.direction),
        ),
      onError: () => invalidateGameCache(),
    }),
  );
};

export const useSubscribeToWordPositionChange = () => {
  const changeGameStateWordPositionCache =
    useChangeGameStateWordPositionCache();
  return useSubscription(
    "game:currentPosition",
    React.useCallback(
      ({ currentPosition }) =>
        changeGameStateWordPositionCache(currentPosition),
      [changeGameStateWordPositionCache],
    ),
  );
};
