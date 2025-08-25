import type React from "react";

import { Card, CardBody } from "@heroui/react";
import { entries } from "remeda";

import { ProposalPhaseOwner } from "~/components/game/proposal/owner";
import { ProposalPhasePlayer } from "~/components/game/proposal/player";
import { type Game, useGame } from "~/hooks/use-game";

export const ProposalPhase: React.FC<{
  state: Extract<Game["state"], { phase: "proposal" }>;
}> = ({ state }) => {
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
          <ProposalPhaseOwner wordId={id} word={word} />
        ) : (
          <ProposalPhasePlayer wordId={id} word={word} />
        )}
      </CardBody>
    </Card>
  );
};
