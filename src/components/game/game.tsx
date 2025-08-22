import React from "react";

import { useSubscribeToWordPositionChange } from "~/hooks/game/use-game-change-word-position";
import { useSubscribeToGameState } from "~/hooks/game/use-game-state";
import { useGame } from "~/hooks/use-game";

import { FinishPhase } from "./phases/finish";
import { GuessingPhase } from "./phases/guessing";
import { ProposalPhase } from "./phases/proposal";
import { StartPhase } from "./phases/start";

export const Game = React.memo(() => {
  const game = useGame();
  useSubscribeToGameState();
  useSubscribeToWordPositionChange();
  switch (game.state.phase) {
    case "start":
      return <StartPhase />;
    case "proposal":
      return <ProposalPhase state={game.state} />;
    case "guessing":
      return <GuessingPhase state={game.state} />;
    case "finish":
      return <FinishPhase state={game.state} />;
  }
});
