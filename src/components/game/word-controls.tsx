import React from "react";

import {
	TbPlayerTrackPrev as PrevIcon,
	TbPlayerTrackNext as NextIcon,
} from "react-icons/tb";

import { ClickableIcon } from "@/components/base/clickable-icon";
import { Flex } from "@/components/base/flex";
import { useGameChangeWordPositionMutation } from "@/hooks/game/use-game-change-word-position";
import { useWordPositions } from "@/hooks/game/use-word-positions";
import { useGame } from "@/hooks/use-game";

export const WordControls = React.memo<React.PropsWithChildren>(
	({ children }) => {
		const { id: gameId, state, words } = useGame();
		const changeWordPositionMutation = useGameChangeWordPositionMutation();
		const prevWord = React.useCallback(
			() =>
				changeWordPositionMutation.mutate({
					id: gameId,
					direction: "backward",
				}),
			[changeWordPositionMutation, gameId],
		);
		const nextWord = React.useCallback(
			() =>
				changeWordPositionMutation.mutate({ id: gameId, direction: "forward" }),
			[changeWordPositionMutation, gameId],
		);
		const { firstWordPosition, lastWordPosition } = useWordPositions();
		const wordsValues = Object.values(words);
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
			<Flex crossAxis="center">
				<ClickableIcon
					Component={PrevIcon}
					onClick={
						currentWord.position === firstWordPosition ? undefined : prevWord
					}
					disabled={currentWord.position === firstWordPosition}
				/>
				{children}
				<ClickableIcon
					Component={NextIcon}
					onClick={
						currentWord.position === lastWordPosition ? undefined : nextWord
					}
					disabled={currentWord.position === lastWordPosition}
				/>
			</Flex>
		);
	},
);
