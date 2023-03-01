import React from "react";

import useTranslation from "next-translate/useTranslation";

import { ErrorMessage } from "@/components/error-message";
import { WordsId } from "@/db/models";
import { Game, useGame } from "@/hooks/use-game";

type Word = Game["words"][WordsId];

type Props = {
	wordPosition: number;
	children: (id: WordsId, word: Word, isOwner: boolean) => React.ReactNode;
};

export const WithWord = React.memo<Props>(({ wordPosition, children }) => {
	const { t } = useTranslation();
	const { isOwner, words } = useGame();
	const wordTuple = Object.entries(words).find(
		([, { position }]) => position === wordPosition,
	);
	if (!wordTuple) {
		return (
			<ErrorMessage
				error={t("components.withWord.noWordError", { position: wordPosition })}
			/>
		);
	}
	const [id, word] = wordTuple;
	return <>{children(id, word, isOwner)}</>;
});
