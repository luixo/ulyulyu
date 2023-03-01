import React from "react";

import { Spacer, Textarea, CSS, styled } from "@nextui-org/react";
import useTranslation from "next-translate/useTranslation";
import {
	BsEye as VisibleIcon,
	BsEyeSlash as InvisibleIcon,
} from "react-icons/bs";

import { ClickableIcon } from "@/components/base/clickable-icon";
import { Flex } from "@/components/base/flex";
import { NextPhaseControl } from "@/components/game/next-phase-control";
import { TeamsReadiness } from "@/components/game/team-readiness";
import { WithDefinition } from "@/components/game/with-definition";
import { WithQuery } from "@/components/game/with-query";
import { WordControls } from "@/components/game/word-controls";
import { WordTracker } from "@/components/game/word-tracker";
import { WordsId } from "@/db/models";
import { useSubscribeToDefinitionReady } from "@/hooks/game/use-update-definition";
import { useWordPositions } from "@/hooks/game/use-word-positions";
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

const Definition = React.memo<{ word: Game["words"][WordsId] }>(({ word }) => {
	const { t } = useTranslation();
	const [showDefinition, setShowDefinition] = React.useState(false);
	const switchShowDefinition = React.useCallback(
		() => setShowDefinition((show) => !show),
		[],
	);
	return (
		<Flex position="relative" flexChildren>
			<Textarea
				label={t("pages.proposal.owner.termLabel", { term: word.term })}
				value={
					showDefinition
						? word.definition
						: t("pages.proposal.owner.definitionMask")
				}
				readOnly
				css={textAreaCss}
			/>
			<TextareaButtonWrapper>
				<ClickableIcon
					Component={showDefinition ? VisibleIcon : InvisibleIcon}
					onClick={switchShowDefinition}
					size={20}
				/>
			</TextareaButtonWrapper>
		</Flex>
	);
});

const useAreAllTeamsReady = () => {
	const { id: gameId } = useGame();
	const definitionsQuery = trpc.definitions.getAdmin.useQuery({ gameId });
	if (definitionsQuery.status !== "success") {
		return false;
	}
	/* eslint-disable no-restricted-syntax */
	for (const word of Object.values(definitionsQuery.data)) {
		for (const ready of Object.values(word)) {
			if (!ready) {
				return false;
			}
		}
	}
	/* eslint-enable no-restricted-syntax */
	return true;
};

type InnerProps = {
	currentWordId: WordsId;
	currentWord: Game["words"][WordsId];
};

export const ProposalPhaseOwner = React.memo<InnerProps>(
	({ currentWordId, currentWord }) => {
		const { id: gameId } = useGame();
		const definitionsQuery = trpc.definitions.getAdmin.useQuery({ gameId });
		useSubscribeToDefinitionReady();

		const allTeamsReady = useAreAllTeamsReady();
		const { lastWordPosition } = useWordPositions();

		return (
			<WithQuery query={definitionsQuery}>
				{(data) => (
					<WithDefinition data={data} id={currentWordId}>
						{(definitions) => (
							<>
								<Flex mainAxis="spaceBetween" crossAxis="center">
									<WordControls>
										<Spacer x={1} />
										<WordTracker />
										<Spacer x={1} />
									</WordControls>
									<NextPhaseControl
										hidden={currentWord.position !== lastWordPosition}
										disabled={!allTeamsReady}
									/>
								</Flex>
								<Spacer y={1} />
								<Definition word={currentWord} />
								<Spacer y={1} />
								<TeamsReadiness readiness={definitions} />
							</>
						)}
					</WithDefinition>
				)}
			</WithQuery>
		);
	},
);
