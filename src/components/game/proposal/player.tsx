import React from "react";

import { FormElement, Spacer, Textarea, CSS, styled } from "@nextui-org/react";
import useTranslation from "next-translate/useTranslation";
import { BsSave as SaveIcon } from "react-icons/bs";

import { ClickableIcon } from "@/components/base/clickable-icon";
import { Flex } from "@/components/base/flex";
import { TeamsReadiness } from "@/components/game/team-readiness";
import { WithDefinition } from "@/components/game/with-definition";
import { WithQuery } from "@/components/game/with-query";
import { WordTracker } from "@/components/game/word-tracker";
import { DEFINITIONS } from "@/db/contants";
import { WordsId } from "@/db/models";
import {
	useUpdateDefinitionMutation,
	useSubscribeToDefinitionReady,
} from "@/hooks/game/use-update-definition";
import { Game, useGame } from "@/hooks/use-game";
import { trpc } from "@/lib/trpc";

const LABEL_TOP_OFFSET = 42;
const BUTTON_INSET = 8;

const textAreaCss: CSS = {
	"& label": {
		letterSpacing: "$tighter",
		fontSize: "$2xl",
		fontWeight: "$semibold",
	},
};

const TextareaButtonWrapper = styled("div", {
	position: "absolute",
	top: LABEL_TOP_OFFSET + BUTTON_INSET,
	right: BUTTON_INSET,
});

const Controls = React.memo(() => (
	<Flex mainAxis="spaceBetween" crossAxis="start">
		<WordTracker />
	</Flex>
));

const Definition = React.memo<{
	wordId: WordsId;
	word: Game["words"][WordsId];
}>(({ wordId, word }) => {
	const { t } = useTranslation();
	const { id: gameId } = useGame();
	const updateDefinitionMutation = useUpdateDefinitionMutation();
	const [definitionOverride, setDefinitionOverride] = React.useState<string>();
	const onTextChange = React.useCallback<React.ChangeEventHandler<FormElement>>(
		(e) => setDefinitionOverride(e.currentTarget.value),
		[],
	);

	const saveDefinition = React.useCallback(
		(nextDefinition: string) => () => {
			if (
				word.definition === nextDefinition ||
				nextDefinition.length < DEFINITIONS.TYPES.MIN_DEFINITION_LENGTH ||
				nextDefinition.length > DEFINITIONS.TYPES.MAX_DEFINITION_LENGTH
			) {
				return;
			}
			updateDefinitionMutation.mutate({
				gameId,
				wordId,
				definition: nextDefinition,
			});
		},
		[gameId, updateDefinitionMutation, wordId, word.definition],
	);
	return (
		<Flex position="relative" flexChildren>
			<Textarea
				label={t("pages.proposal.player.termLabel", { term: word.term })}
				value={definitionOverride || word.definition}
				onChange={onTextChange}
				minLength={DEFINITIONS.TYPES.MIN_DEFINITION_LENGTH}
				maxLength={DEFINITIONS.TYPES.MAX_DEFINITION_LENGTH}
				css={textAreaCss}
			/>
			<TextareaButtonWrapper>
				<ClickableIcon
					Component={SaveIcon}
					disabled={!definitionOverride}
					onClick={saveDefinition(definitionOverride || "")}
					size={20}
				/>
			</TextareaButtonWrapper>
		</Flex>
	);
});

type InnerProps = {
	currentWordId: WordsId;
	currentWord: Game["words"][WordsId];
};

export const ProposalPhasePlayer = React.memo<InnerProps>(
	({ currentWordId, currentWord }) => {
		const { id: gameId } = useGame();
		const definitionsQuery = trpc.definitions.getPlayer.useQuery({ gameId });
		useSubscribeToDefinitionReady();

		return (
			<WithQuery query={definitionsQuery}>
				{(data) => (
					<WithDefinition data={data} id={currentWordId}>
						{(definitions) => (
							<>
								<Controls />
								<Spacer y={1} />
								<Definition wordId={currentWordId} word={currentWord} />
								<Spacer y={0.5} />
								<TeamsReadiness readiness={definitions.readiness} />
							</>
						)}
					</WithDefinition>
				)}
			</WithQuery>
		);
	},
);
