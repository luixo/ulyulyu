import React from "react";

import { Card, CardBody } from "@heroui/react";
import { entries } from "remeda";

import { GuessingPhaseOwner } from "~/components/game/guessing/owner";
import { GuessingPhasePlayer } from "~/components/game/guessing/player";
import { type Game, useGame } from "~/hooks/use-game";

type Props = {
  state: Extract<Game["state"], { phase: "guessing" }>;
};

export const GuessingPhase = React.memo<Props>(({ state }) => {
  const { isOwner, words } = useGame();
  const wordTuple = entries(words).find(
    ([, { position }]) => position === state.currentPosition,
  );
  if (!wordTuple) {
    return null;
  }
  const [id, word] = wordTuple;
  return (
    <Card>
      <CardBody>
        {isOwner ? (
          <GuessingPhaseOwner wordId={id} word={word} />
        ) : (
          <GuessingPhasePlayer wordId={id} word={word} />
        )}
      </CardBody>
    </Card>
  );
});
