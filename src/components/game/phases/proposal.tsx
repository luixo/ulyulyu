import React from "react";

import { Card } from "@/components/base/card";
import { ProposalPhaseOwner } from "@/components/game/proposal/owner";
import { ProposalPhasePlayer } from "@/components/game/proposal/player";
import { WithWord } from "@/components/game/with-word";
import { Game } from "@/hooks/use-game";

type Props = {
	state: Extract<Game["state"], { phase: "proposal" }>;
};

export const ProposalPhase = React.memo<Props>(({ state }) => (
	<WithWord wordPosition={state.currentPosition}>
		{(id, word, isOwner) => (
			<Card>
				{isOwner ? (
					<ProposalPhaseOwner currentWordId={id} currentWord={word} />
				) : (
					<ProposalPhasePlayer currentWordId={id} currentWord={word} />
				)}
			</Card>
		)}
	</WithWord>
));
