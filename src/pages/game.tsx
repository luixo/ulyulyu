import type React from "react";

import { Skeleton } from "@heroui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Game } from "~/components/game/game";
import { Header } from "~/components/header";
import { suspendedFallback } from "~/components/suspense-wrapper";
import { GameContext } from "~/contexts/game-context";
import type { GameId } from "~/server/validation";
import { useTRPC } from "~/utils/trpc";

const GameWrapper = suspendedFallback<{ id: GameId }>(
  ({ id }) => {
    const trpc = useTRPC();
    const { data: game } = useSuspenseQuery(
      trpc.games.get.queryOptions({ id }),
    );
    return (
      <GameContext.Provider value={game}>
        <Game />
      </GameContext.Provider>
    );
  },
  <>
    <Skeleton className="h-40 w-full rounded-lg" />
    <Skeleton className="h-40 w-full rounded-lg" />
  </>,
);

export const Page: React.FC<{ id: GameId }> = ({ id }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4">
      <Header
        title={
          <h1 className="flex-1 self-center text-left text-xl font-semibold">
            {t("pages.game.title", { id })}
          </h1>
        }
      />
      <GameWrapper id={id} />
    </div>
  );
};
