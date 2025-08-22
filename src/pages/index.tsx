import React from "react";

import { Button, Card, CardBody, Input, Skeleton } from "@heroui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ErrorMessage } from "~/components/error-message";
import { Header } from "~/components/header";
import { suspendedFallback } from "~/components/suspense-wrapper";
import { GAMES } from "~/db/const";
import { useCreateGame } from "~/hooks/use-create-game";
import type { RouterOutput } from "~/utils/query";
import { useTRPC } from "~/utils/trpc";

const PreviousGame = React.memo<{
  game: RouterOutput["games"]["getAll"][number];
}>(({ game }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const joinGame = React.useCallback(() => {
    router.navigate({ to: "/games/$id", params: { id: game.id } });
  }, [game.id, router]);
  const timestamp = new Date(game.createdAt);
  return (
    <Button
      onPress={joinGame}
      color={
        game.state === "done"
          ? "success"
          : game.state === "start"
            ? "primary"
            : "secondary"
      }
    >
      {t("pages.index.resumeGame.button", {
        date: new Intl.DateTimeFormat("en").format(timestamp),
      })}
    </Button>
  );
});

const PreviousGamesCardWrapper: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { t } = useTranslation();
  return (
    <Card>
      <CardBody className="flex flex-col gap-2">
        <h2 className="text-2xl leading-normal font-semibold">
          {t("pages.index.resumeGame.title")}
        </h2>
        {children}
      </CardBody>
    </Card>
  );
};

const PreviousGamesCard = suspendedFallback(
  () => {
    const trpc = useTRPC();
    const { data: games } = useSuspenseQuery(trpc.games.getAll.queryOptions());
    if (games.length === 0) {
      return null;
    }
    return (
      <PreviousGamesCardWrapper>
        {games.map((game) => (
          <PreviousGame key={game.id} game={game} />
        ))}
      </PreviousGamesCardWrapper>
    );
  },
  <PreviousGamesCardWrapper>
    {Array.from({ length: 3 }).map((_, index) => (
      <Skeleton key={index} className="h-10 w-full rounded-lg" />
    ))}
  </PreviousGamesCardWrapper>,
);

const CreateGameCard = React.memo(() => {
  const { t } = useTranslation();
  const createGameMutation = useCreateGame();
  const createGame = React.useCallback(() => {
    createGameMutation.mutate();
  }, [createGameMutation]);
  return (
    <Card>
      <CardBody className="flex flex-col gap-2">
        <h2 className="text-2xl leading-normal font-semibold">
          {t("pages.index.createGame.title")}
        </h2>
        <Button
          color={createGameMutation.status === "error" ? "danger" : "primary"}
          onPress={createGame}
          isDisabled={
            createGameMutation.status === "pending" ||
            createGameMutation.status === "success"
          }
          isLoading={createGameMutation.status === "pending"}
        >
          {createGameMutation.status === "error"
            ? t("common.tryAgain")
            : createGameMutation.status === "success"
              ? t("pages.index.createGame.success")
              : t("pages.index.createGame.button")}
        </Button>
        {createGameMutation.status === "error" ? (
          <ErrorMessage error={createGameMutation.error} />
        ) : null}
      </CardBody>
    </Card>
  );
});

const JoinGameCard = React.memo(() => {
  const { t } = useTranslation();
  const router = useRouter();
  const [slug, setSlug] = React.useState("");
  const joinGame = React.useCallback(() => {
    if (slug.length !== GAMES.TYPES.ID_LENGTH) {
      return;
    }
    router.navigate({ to: "/games/$id", params: { id: slug } });
  }, [slug, router]);
  return (
    <Card>
      <CardBody className="flex flex-col gap-2">
        <h2 className="text-2xl leading-normal font-semibold">
          {t("pages.index.joinGame.title")}
        </h2>
        <Input
          label={t("pages.index.joinGame.inputLabel")}
          value={slug}
          onValueChange={setSlug}
          maxLength={GAMES.TYPES.ID_LENGTH}
          size="sm"
          labelPlacement="outside"
          placeholder=" "
        />
        <Button color="primary" onPress={joinGame} isDisabled={!slug}>
          {t("pages.index.joinGame.button")}
        </Button>
      </CardBody>
    </Card>
  );
});

export const Page = React.memo(() => (
  <div className="flex flex-col gap-4">
    <Header />
    <CreateGameCard />
    <JoinGameCard />
    <PreviousGamesCard />
  </div>
));
