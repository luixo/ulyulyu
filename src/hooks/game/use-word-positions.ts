import { useGame } from "@/hooks/use-game";

export const useWordPositions = () => {
	const { words } = useGame();
	const wordsValues = Object.values(words);
	return {
		lastWordPosition: wordsValues.reduce(
			(acc, { position }) => Math.max(acc, position),
			-Infinity,
		),
		firstWordPosition: wordsValues.reduce(
			(acc, { position }) => Math.min(acc, position),
			Infinity,
		),
	};
};
