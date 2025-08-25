import type React from "react";

import { useTranslation } from "react-i18next";
import { keys, values } from "remeda";
import { twMerge } from "tailwind-merge";

import { useGame } from "~/hooks/use-game";

export const WordTracker: React.FC<{
  className?: string;
}> = ({ className }) => {
  const { t } = useTranslation();
  const { words, state } = useGame();
  const wordsValues = values(words).sort(
    (wordA, wordB) => wordA.position - wordB.position,
  );
  if (state.phase !== "guessing" && state.phase !== "proposal") {
    return <div>Component should be used with guesing or proposal phase</div>;
  }
  const { currentPosition } = state;
  const currentWordIndex = wordsValues.findIndex(
    ({ position }) => position === currentPosition,
  );
  if (currentWordIndex === -1) {
    return (
      <div>Word with current position {currentPosition} is not found!</div>
    );
  }
  return (
    <span className={twMerge("text-lg", className)}>
      {t("components.wordTracker.title", {
        index: currentWordIndex + 1,
        total: keys(words).length,
      })}
    </span>
  );
};
