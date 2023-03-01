import React from "react";

import { gameContext, MaybeGame } from "@/contexts/game-context";

export type Game = NonNullable<MaybeGame>;

export const useGame = () => {
	const game = React.useContext(gameContext);
	if (!game) {
		throw new Error("This component should be used with game context");
	}
	return game;
};
