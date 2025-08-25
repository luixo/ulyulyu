import type React from "react";

import {
  IoCaretForwardOutline as NextIcon,
  IoCaretBackOutline as PrevIcon,
} from "react-icons/io5";
import { values } from "remeda";
import { twMerge } from "tailwind-merge";

import { ClickableIcon } from "~/components/base/clickable-icon";
import { useGameChangeWordPositionMutation } from "~/hooks/game/use-game-change-word-position";
import { useWordPositions } from "~/hooks/game/use-word-positions";
import { useGame } from "~/hooks/use-game";

export const WordControls: React.FC<
  React.PropsWithChildren<{
    className?: string;
  }>
> = ({ className, children }) => {
  const { id: gameId, state, words } = useGame();
  const changeWordPositionMutation = useGameChangeWordPositionMutation();
  const { firstWordPosition, lastWordPosition } = useWordPositions();
  const wordsValues = values(words);
  if (state.phase !== "guessing" && state.phase !== "proposal") {
    return <div>Component should be used with guesing or proposal phase</div>;
  }
  const { currentPosition } = state;
  const currentWord = wordsValues.find(
    ({ position }) => position === currentPosition,
  );
  if (!currentWord) {
    return (
      <div>Word with current position {currentPosition} is not found!</div>
    );
  }
  return (
    <div className={twMerge("flex items-center gap-2", className)}>
      <ClickableIcon
        Component={PrevIcon}
        onClick={
          currentWord.position === firstWordPosition
            ? undefined
            : () =>
                changeWordPositionMutation.mutate({
                  id: gameId,
                  direction: "backward",
                })
        }
        disabled={currentWord.position === firstWordPosition}
        size={32}
      />
      {children}
      {
        <ClickableIcon
          Component={NextIcon}
          onClick={
            currentWord.position === lastWordPosition
              ? undefined
              : () =>
                  changeWordPositionMutation.mutate({
                    id: gameId,
                    direction: "forward",
                  })
          }
          disabled={currentWord.position === lastWordPosition}
          size={32}
        />
      }
    </div>
  );
};
