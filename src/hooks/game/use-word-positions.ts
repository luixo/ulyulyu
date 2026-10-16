import { values } from "remeda";
import { useGame } from "~/hooks/use-game";

export const useWordPositions = () => {
	const { words } = useGame();
	const wordsValues = values(words);
	return {
		firstWordPosition: wordsValues.reduce(
			(acc, { position }) => Math.min(acc, position),
			Infinity,
		),
		lastWordPosition: wordsValues.reduce(
			(acc, { position }) => Math.max(acc, position),
			-Infinity,
		),
	};
};
