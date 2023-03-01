import React from "react";

import { Text } from "@nextui-org/react";
import useTranslation from "next-translate/useTranslation";

import { useGame } from "@/hooks/use-game";

export const WordTracker = React.memo(() => {
	const { t } = useTranslation();
	const { words, state } = useGame();
	const wordsValues = Object.values(words);
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
		<Text size={18}>
			{t("components.wordTracker.title", {
				index: currentWordIndex + 1,
				total: Object.keys(words).length,
			})}
		</Text>
	);
});
