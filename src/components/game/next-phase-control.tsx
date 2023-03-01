import React from "react";

import { BsPlay as StartIcon } from "react-icons/bs";

import { ClickableIcon } from "@/components/base/clickable-icon";
import { useGameStateMutation } from "@/hooks/game/use-game-state";
import { useGame } from "@/hooks/use-game";

export const NextPhaseControl = React.memo<{
	hidden?: boolean;
	disabled?: boolean;
}>(({ hidden, disabled }) => {
	const gameStateMutation = useGameStateMutation();
	const { id: gameId } = useGame();
	const nextPhase = React.useCallback(() => {
		gameStateMutation.mutate({ id: gameId, direction: "forward" });
	}, [gameStateMutation, gameId]);
	if (hidden) {
		return null;
	}
	return (
		<ClickableIcon
			Component={StartIcon}
			size={40}
			disabled={disabled}
			onClick={nextPhase}
		/>
	);
});
