import type { SetStateAction } from "react";

import { useMutation } from "@tanstack/react-query";
import { values } from "remeda";
import { useEventCallback } from "usehooks-ts";

import { useGame } from "~/hooks/use-game";
import { useSubscription } from "~/hooks/use-subscription";
import { useInvalidateCache, useUpdateCache } from "~/hooks/use-update-cache";
import { updateSetStateAction } from "~/utils/react";
import { useTRPC } from "~/utils/trpc";

const useChangeGameStateWordPositionCache = () => {
  const trpc = useTRPC();
  const { id } = useGame();
  const updateGameCache = useUpdateCache(trpc.games.get.queryFilter({ id }));
  return useEventCallback((positionAction: SetStateAction<number>) =>
    updateGameCache((game) => {
      if (game.state.phase !== "proposal" && game.state.phase !== "guessing") {
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
  );
};

export const useGameChangeWordPositionMutation = () => {
  const trpc = useTRPC();
  const { words, id } = useGame();
  const invalidateGameCache = useInvalidateCache(
    trpc.games.get.queryFilter({ id }),
  );
  const changeGameStateWordPositionCache =
    useChangeGameStateWordPositionCache();
  return useMutation(
    trpc.games.changeStateCurrentPosition.mutationOptions({
      onMutate: (variables) =>
        changeGameStateWordPositionCache((prevPosition) => {
          const sortedWordsValues = values(words).sort(
            (a, b) => a.position - b.position,
          );
          const currentWordIndex = sortedWordsValues.findIndex(
            ({ position }) => position === prevPosition,
          );
          if (currentWordIndex === -1) {
            throw new Error(
              `Expected to have word with position "${prevPosition}"`,
            );
          }
          if (variables.direction === "forward") {
            const nextWord = sortedWordsValues[currentWordIndex + 1];
            if (!nextWord) {
              throw new Error(
                `Expected to have next word starting from "${prevPosition}", find none`,
              );
            }
            return nextWord.position;
          }
          const prevWord = sortedWordsValues[currentWordIndex - 1];
          if (!prevWord) {
            throw new Error(
              `Expected to have prev word starting from "${prevPosition}", find none`,
            );
          }
          return prevWord.position;
        }),
      onError: () => invalidateGameCache(),
    }),
  );
};

export const useSubscribeToWordPositionChange = () => {
  const changeGameStateWordPositionCache =
    useChangeGameStateWordPositionCache();
  return useSubscription(
    "game:currentPosition",
    useEventCallback(({ currentPosition }) =>
      changeGameStateWordPositionCache(currentPosition),
    ),
  );
};
