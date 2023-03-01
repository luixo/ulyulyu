import React from "react";

import { Radio, Spacer, Text } from "@nextui-org/react";

import { Flex } from "@/components/base/flex";
import { TeamsReadiness } from "@/components/game/team-readiness";
import { WithDefinition } from "@/components/game/with-definition";
import { WithQuery } from "@/components/game/with-query";
import { WordTracker } from "@/components/game/word-tracker";
import { WordsId } from "@/db/models";
import {
	useSubscribeToTeamVoted,
	useVoteMutation,
} from "@/hooks/game/use-vote";
import { Game, useGame } from "@/hooks/use-game";
import { RouterOutput, trpc } from "@/lib/trpc";

type Guessing = RouterOutput["definitions"]["getPlayerGuessing"];

const Definition = React.memo<{
	revealMap: Guessing[WordsId]["revealMap"];
	definition: string;
	maskedTeamId: string;
}>(({ revealMap, maskedTeamId, definition }) => {
	const { teams } = useGame();
	const revealData = revealMap ? revealMap[maskedTeamId] : undefined;
	const actualTeam = teams[revealData?.id ?? "unknown"];
	const color = revealMap
		? actualTeam
			? ("error" as const)
			: ("success" as const)
		: undefined;
	return (
		<Radio
			key={maskedTeamId}
			value={maskedTeamId}
			color={color}
			labelColor={color}
		>
			{revealMap ? (
				<>
					{`[${actualTeam ? actualTeam.nickname : "original"}]`}
					<Spacer x={0.25} />
				</>
			) : null}
			{definition}
		</Radio>
	);
});

const TeamsDefinitions = React.memo<{
	word: Game["words"][WordsId];
	wordId: WordsId;
	definitions: Guessing[WordsId];
}>(({ word, wordId, definitions }) => {
	const { id: gameId } = useGame();

	const voteMutation = useVoteMutation();

	const vote = React.useCallback(
		(guessUserId: string) =>
			voteMutation.mutate({ gameId, wordId, guessUserId }),
		[voteMutation, wordId, gameId],
	);
	return (
		<Radio.Group
			label={
				<Flex crossAxis="center">
					<Text size={32} b>
						{word.term}
					</Text>
					<Spacer x={0.25} />
					<WordTracker />
				</Flex>
			}
			value={definitions.vote || undefined}
			onChange={vote}
			isDisabled={Boolean(definitions.revealMap)}
		>
			<Radio value="-" isDisabled>
				{word.definition}
			</Radio>
			{Object.entries(definitions.definitions).map(([id, definition]) => (
				<Definition
					maskedTeamId={id}
					definition={definition}
					revealMap={definitions.revealMap}
				/>
			))}
		</Radio.Group>
	);
});

type Props = {
	wordId: WordsId;
	word: Game["words"][WordsId];
};

export const GuessingPhasePlayer = React.memo<Props>(({ wordId, word }) => {
	const { id: gameId } = useGame();
	const definitionsQuery = trpc.definitions.getPlayerGuessing.useQuery({
		gameId,
	});
	useSubscribeToTeamVoted();

	return (
		<WithQuery query={definitionsQuery}>
			{(data) => (
				<WithDefinition data={data} id={wordId}>
					{(definitions) => (
						<>
							<TeamsDefinitions
								definitions={definitions}
								word={word}
								wordId={wordId}
							/>
							<Spacer y={1} />
							<TeamsReadiness readiness={definitions.readiness} />
						</>
					)}
				</WithDefinition>
			)}
		</WithQuery>
	);
});
