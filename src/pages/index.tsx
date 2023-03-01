import React from "react";

import {
	Button,
	FormElement,
	Input,
	Loading,
	Spacer,
	Text,
} from "@nextui-org/react";
import { format } from "date-fns";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import { Card } from "@/components/base/card";
import { ErrorMessage } from "@/components/error-message";
import { Header } from "@/components/header";
import { GAMES } from "@/db/contants";
import { useCreateGame } from "@/hooks/use-create-game";
import { RouterOutput, trpc } from "@/lib/trpc";

const PreviousGame = React.memo<{
	game: RouterOutput["games"]["getAll"][number];
}>(({ game }) => {
	const { t } = useTranslation();
	const router = useRouter();
	const joinGame = React.useCallback(() => {
		router.push(`/game/${game.id}`);
	}, [game.id, router]);
	const timestamp = new Date(game.createTimestamp);
	return (
		<Button
			onClick={joinGame}
			color={
				game.state.phase === "finish"
					? "success"
					: game.state.phase === "start"
					  ? "primary"
					  : "secondary"
			}
		>
			{t("pages.index.resumeGame.button", {
				date: format(timestamp, "do MMMM yyyy"),
			})}
		</Button>
	);
});

const PreviousGamesCard = React.memo(() => {
	const { t } = useTranslation();
	const getAllGamesQuery = trpc.games.getAll.useQuery();
	if (
		getAllGamesQuery.status !== "success" ||
		getAllGamesQuery.data.length === 0
	) {
		return null;
	}
	return (
		<>
			<Spacer y={1} />
			<Card>
				<Text h2>{t("pages.index.resumeGame.title")}</Text>
				{getAllGamesQuery.data.map((game) => (
					<React.Fragment key={game.id}>
						<Spacer y={0.5} />
						<PreviousGame key={game.id} game={game} />
					</React.Fragment>
				))}
			</Card>
		</>
	);
});

const CreateGameCard = React.memo(() => {
	const { t } = useTranslation();
	const createGameMutation = useCreateGame();
	const createGame = React.useCallback(() => {
		createGameMutation.mutate();
	}, [createGameMutation]);
	return (
		<Card>
			<Text h2>{t("pages.index.createGame.title")}</Text>
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
					t("pages.index.createGame.success")
				) : (
					t("pages.index.createGame.button")
				)}
			</Button>
			{createGameMutation.status === "error" ? (
				<ErrorMessage error={createGameMutation.error} />
			) : null}
		</Card>
	);
});

const JoinGameCard = React.memo(() => {
	const { t } = useTranslation();
	const router = useRouter();
	const [slug, setSlug] = React.useState("");
	const onChange = React.useCallback<React.ChangeEventHandler<FormElement>>(
		(e) => setSlug(e.currentTarget.value),
		[setSlug],
	);
	const joinGame = React.useCallback(() => {
		if (slug.length !== GAMES.TYPES.ID_LENGTH) {
			return;
		}
		router.push(`/game/${slug}`);
	}, [slug, router]);
	return (
		<Card>
			<Text h2>{t("pages.index.joinGame.title")}</Text>
			<Input
				label={t("pages.index.joinGame.inputLabel")}
				value={slug}
				onChange={onChange}
				maxLength={GAMES.TYPES.ID_LENGTH}
			/>
			<Spacer y={1} />
			<Button onClick={joinGame} disabled={!slug}>
				{t("pages.index.joinGame.button")}
			</Button>
		</Card>
	);
});

const Page = React.memo(() => {
	const { t } = useTranslation();
	return (
		<>
			<Header />
			<Text h1>{t("pages.index.title")}</Text>
			<CreateGameCard />
			<Spacer y={1} />
			<JoinGameCard />
			<Spacer y={1} />
			<PreviousGamesCard />
		</>
	);
});

export default Page;
