import React from "react";

import type { GameContextType } from "~/contexts/game-context";
import { GameContext } from "~/contexts/game-context";

export type Game = NonNullable<GameContextType>;

export const useGame = () => {
  const game = React.use(GameContext);
  if (!game) {
    throw new Error("This component should be used with game context");
  }
  return game;
};
