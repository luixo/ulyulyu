import React from "react";

import {
	Button,
	CSS,
	Loading,
	Spacer,
	Table,
	styled,
	useAsyncList,
} from "@nextui-org/react";
import type { AsyncListOptions } from "@react-stately/data";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import { IoIosCheckmark as CheckIcon } from "react-icons/io";

import { ErrorMessage } from "@/components/error-message";
import { UsersId, WordsId } from "@/db/models";
import { useCreateGame } from "@/hooks/use-create-game";
import { Game, useGame } from "@/hooks/use-game";
import { useSelfUserId } from "@/hooks/use-self-user-id";
import { trpc } from "@/lib/trpc";
import { nonNullishGuard } from "@/lib/utils";

const columnCss: CSS = { whiteSpace: "break-spaces", textAlign: "center" };
const nameColumnCss: CSS = {
	...columnCss,
	textAlign: "right",
};

const Checks = styled("div", {
	display: "flex",
});

const CheckWrapper = styled("div", {
	size: 12,
	backgroundColor: "$success",
	display: "flex",
	flexShrink: 0,
	alignItems: "center",
	justifyContent: "center",
	borderRadius: "$rounded",
	color: "$background",
});

type DefinitionColumn = {
	id: WordsId;
	definition: string;
	voters: UsersId[];
};

type DefinitionsRow = {
	id: UsersId | null;
	nickname: string;
	definitions: DefinitionColumn[];
};

const ResultsHeader = React.memo(() => {
	const { words } = useGame();
	const columns: [string, { term: string; stickRight?: boolean }][] = [
		["*", { term: "*" }],
		...Object.entries(words),
	];
	return (
		<Table.Header columns={columns}>
			{([wordId, { term, stickRight }]) => (
				<Table.Column key={wordId} css={stickRight ? nameColumnCss : columnCss}>
					{term}
				</Table.Column>
			)}
		</Table.Header>
	);
});

const ResultCell = React.memo<{ definition: string; voters: UsersId[] }>(
	({ definition, voters }) => (
		<Checks>
			{definition}
			{voters.map((voter) => (
				<React.Fragment key={voter}>
					<Spacer x={0.3} />
					<CheckWrapper>
						<CheckIcon size={10} />
					</CheckWrapper>
				</React.Fragment>
			))}
		</Checks>
	),
);

const ResultRow = React.memo<{ data: DefinitionsRow }>(
	({ data: { id: teamId, nickname, definitions } }) => (
		<Table.Row key={teamId}>
			<Table.Cell css={nameColumnCss}>{nickname}</Table.Cell>
			{definitions.map(({ id: wordId, definition, voters }) => (
				<Table.Cell css={columnCss} key={wordId}>
					<ResultCell definition={definition} voters={voters} />
				</Table.Cell>
			))}
		</Table.Row>
	),
);

const StartNewGameButton = React.memo(() => {
	const { t } = useTranslation();
	const createGameMutation = useCreateGame();
	const createGame = React.useCallback(() => {
		createGameMutation.mutate();
	}, [createGameMutation]);
	return (
		<>
			<Button
				onClick={createGame}
				disabled={
					createGameMutation.status === "loading" ||
					createGameMutation.status === "success"
				}
				color={createGameMutation.status === "error" ? "error" : undefined}
			>
				{createGameMutation.status === "loading" ? (
					<Loading color="currentColor" size="sm" />
				) : createGameMutation.status === "error" ? (
					t("common.tryAgain")
				) : createGameMutation.status === "success" ? (
					t("pages.finish.newGame.success")
				) : (
					t("pages.finish.newGame.button")
				)}
			</Button>
			{createGameMutation.status === "error" ? (
				<ErrorMessage error={createGameMutation.error} />
			) : null}
		</>
	);
});

const ToIndexButton = React.memo(() => {
	const { t } = useTranslation();
	const router = useRouter();
	const toMainPage = React.useCallback(() => router.push("/"), [router]);
	return <Button onClick={toMainPage}>{t("pages.finish.back.button")}</Button>;
});

const useLoadData = () => {
	const { t } = useTranslation();
	const { id: gameId, words, teams, isOwner } = useGame();
	const selfUserId = useSelfUserId();
	const trpcUtils = trpc.useUtils();
	const definitionQuery =
		trpcUtils.client.definitions[
			isOwner ? "getAdminGuessing" : "getPlayerGuessing"
		].query;
	return React.useCallback<
		AsyncListOptions<DefinitionsRow, undefined>["load"]
	>(async () => {
		const definitions = await definitionQuery({ gameId });
		return {
			items: [
				...Object.entries(teams),
				[null, { nickname: t("pages.finish.actualTeamNickname") }] as const,
			].map(([teamId, team]) => ({
				id: teamId,
				nickname: team.nickname,
				definitions: Object.entries(words).map(([wordId, word]) => {
					const wordDefinition = definitions[wordId];
					if (!("revealMap" in wordDefinition) || !wordDefinition.revealMap) {
						throw new Error(
							`Expected to have reveal map for word "${word.term}" (id "${wordId}")`,
						);
					}
					const voters = Object.values(wordDefinition.revealMap)
						.filter((value) => (value ? value.vote === teamId : null))
						.filter(nonNullishGuard)
						.map((value) => value.id);
					if (isOwner) {
						if (!("originalDefinition" in wordDefinition)) {
							throw new Error(
								`Expected to have voters for word "${word.term}" (id "${wordId}")`,
							);
						}
						return {
							id: wordId,
							definition:
								teamId === null
									? word.definition!
									: wordDefinition.definitions[teamId],
							voters,
						};
					}
					if (!selfUserId) {
						throw new Error(
							`Expected to have selfUserId as not an owner of the game`,
						);
					}
					const revealData = Object.entries(wordDefinition.revealMap).find(
						([, revealDatum]) =>
							(revealDatum ? revealDatum.id : null) === teamId,
					);
					if (!revealData) {
						throw new Error(
							`Expected to have reveal map for team "${team.nickname}" (id "${teamId}")`,
						);
					}
					const [obfuscatedTeamId] = revealData;
					return {
						id: wordId,
						definition: (wordDefinition.definitions as Record<string, string>)[
							obfuscatedTeamId
						],
						voters,
					};
				}),
			})),
			cursor: undefined,
		};
	}, [t, gameId, teams, words, isOwner, definitionQuery, selfUserId]);
};

type Props = {
	state: Extract<Game["state"], { phase: "finish" }>;
};

export const FinishPhase = React.memo<Props>(() => {
	const list = useAsyncList({ load: useLoadData() });
	return (
		<>
			<Spacer y={1} />
			{list.loadingState === "error" ? (
				<ErrorMessage error={list.error} />
			) : (
				<Table aria-label="Results">
					<ResultsHeader />
					<Table.Body items={list.items} loadingState={list.loadingState}>
						{(data) => <ResultRow data={data} />}
					</Table.Body>
				</Table>
			)}
			<Spacer y={1} />
			<StartNewGameButton />
			<Spacer y={1} />
			<ToIndexButton />
		</>
	);
});
