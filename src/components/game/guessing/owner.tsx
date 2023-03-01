import React from "react";

import { Spacer, Text, styled } from "@nextui-org/react";
import useTranslation from "next-translate/useTranslation";
import {
	BsFillEyeSlashFill as CrossedEyeIcon,
	BsFillEyeFill as EyeIcon,
} from "react-icons/bs";
import { FaBoxOpen as OpenBox, FaBox as ClosedBox } from "react-icons/fa";

import { ClickableIcon } from "@/components/base/clickable-icon";
import { Flex } from "@/components/base/flex";
import { NextPhaseControl } from "@/components/game/next-phase-control";
import { TeamsReadiness } from "@/components/game/team-readiness";
import { WithDefinition } from "@/components/game/with-definition";
import { WithQuery } from "@/components/game/with-query";
import { WithTeam } from "@/components/game/with-team";
import { WordControls } from "@/components/game/word-controls";
import { WordTracker } from "@/components/game/word-tracker";
import { WordsId } from "@/db/models";
import {
	useRevealWordMutation,
	useSubscribeToWordReveal,
} from "@/hooks/game/use-reveal-word";
import { useWordPositions } from "@/hooks/game/use-word-positions";
import { Game, useGame } from "@/hooks/use-game";
import { RouterOutput, trpc } from "@/lib/trpc";

type Guessing = RouterOutput["definitions"]["getAdminGuessing"];

const DefinitionText = styled(Text, {
	display: "flex",
	alignItems: "center",
	marginBottom: 0,
});

const Definition = React.memo<{
	wordId: WordsId;
	definition: string;
	revealMap: Guessing[WordsId]["revealMap"];
}>(({ wordId, definition, revealMap }) => {
	const { t } = useTranslation();
	const { id: gameId } = useGame();
	const [hiddenDefinition, setHiddenDefinition] = React.useState(false);
	const switchHideDefinition = React.useCallback(
		() => setHiddenDefinition((show) => !show),
		[],
	);
	const revealMutation = useRevealWordMutation();
	const revealWord = React.useCallback(() => {
		revealMutation.mutate({ gameId, wordId });
	}, [wordId, gameId, revealMutation]);
	return (
		<DefinitionText h4>
			<ClickableIcon
				onClick={revealWord}
				Component={revealMap ? ClosedBox : OpenBox}
				disabled={Boolean(revealMap)}
				size={32}
			/>
			<Spacer x={0.5} />
			{hiddenDefinition ? t("pages.guessing.owner.definitionMask") : definition}
			<Spacer x={1} />
			<ClickableIcon
				onClick={switchHideDefinition}
				Component={hiddenDefinition ? EyeIcon : CrossedEyeIcon}
				size={32}
			/>
		</DefinitionText>
	);
});

const TeamsDefinitions = React.memo<{
	definitions: Guessing[WordsId]["definitions"];
}>(({ definitions }) => {
	const { t } = useTranslation();
	const { teams } = useGame();
	return (
		<Text>
			{Object.entries(definitions).map(([id, definition]) => (
				<WithTeam data={teams} key={id} id={id}>
					{(team) => (
						<DefinitionText>
							<Text b>
								{t("pages.guessing.teamLabel", { team: team.nickname })}:
							</Text>
							<Spacer x={0.25} />
							{definition}
						</DefinitionText>
					)}
				</WithTeam>
			))}
		</Text>
	);
});

type Props = {
	wordId: WordsId;
	word: Game["words"][WordsId];
};

export const GuessingPhaseOwner = React.memo<Props>(({ wordId, word }) => {
	const { id: gameId } = useGame();
	const definitionsQuery = trpc.definitions.getAdminGuessing.useQuery({
		gameId,
	});
	const { lastWordPosition } = useWordPositions();
	useSubscribeToWordReveal();
	return (
		<WithQuery query={definitionsQuery}>
			{(data) => {
				const allWordsReady = Object.values(data).every(
					(definition) =>
						Object.values(definition.readiness).every(Boolean) &&
						Boolean(definition.revealMap),
				);
				return (
					<WithDefinition data={data} id={wordId}>
						{(wordDefinition) => (
							<>
								<Flex crossAxis="center" mainAxis="spaceBetween">
									<WordControls>
										<Spacer x={1} />
										<WordTracker />
										<Spacer x={1} />
									</WordControls>
									<NextPhaseControl
										hidden={word.position !== lastWordPosition}
										disabled={!allWordsReady}
									/>
								</Flex>
								<Spacer y={1} />
								<Definition
									wordId={wordId}
									definition={wordDefinition.originalDefinition}
									revealMap={wordDefinition.revealMap}
								/>
								<Spacer y={1} />
								<TeamsDefinitions definitions={wordDefinition.definitions} />
								<Spacer y={1} />
								<TeamsReadiness readiness={wordDefinition.readiness} />
							</>
						)}
					</WithDefinition>
				);
			}}
		</WithQuery>
	);
});
