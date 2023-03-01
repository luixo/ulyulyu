import React from "react";

import { Card } from "@/components/base/card";
import { GuessingPhaseOwner } from "@/components/game/guessing/owner";
import { GuessingPhasePlayer } from "@/components/game/guessing/player";
import { WithWord } from "@/components/game/with-word";
import { Game } from "@/hooks/use-game";

type Props = {
	state: Extract<Game["state"], { phase: "guessing" }>;
};

export const GuessingPhase = React.memo<Props>(({ state }) => (
	<WithWord wordPosition={state.currentPosition}>
		{(id, word, isOwner) => (
			<Card>
				{isOwner ? (
					<GuessingPhaseOwner wordId={id} word={word} />
				) : (
					<GuessingPhasePlayer wordId={id} word={word} />
				)}
			</Card>
		)}
	</WithWord>
));
