import React from "react";

import { Text, styled } from "@nextui-org/react";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import { Game } from "@/components/game/game";
import { WithQuery } from "@/components/game/with-query";
import { Header } from "@/components/header";
import { gameContext } from "@/contexts/game-context";
import { trpc } from "@/lib/trpc";

const Title = styled(Text, {
	fontSize: "$xl4",
	alignSelf: "flex-end",
});

const Page = React.memo(() => {
	const { t } = useTranslation();
	const router = useRouter();
	const id = router.query.id as string;
	const gameQuery = trpc.games.get.useQuery({ id });
	const title = React.useMemo(
		() => <Title h1>{t("pages.game.title", { id })}</Title>,
		[t, id],
	);
	return (
		<>
			<Header title={title} />
			<WithQuery query={gameQuery}>
				{(data) => (
					<gameContext.Provider value={data}>
						<Game />
					</gameContext.Provider>
				)}
			</WithQuery>
		</>
	);
});

export default Page;
