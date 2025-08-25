import React from "react";

import { Button, Textarea } from "@heroui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { keys, values } from "remeda";

import { PositionHeader } from "~/components/game/position-header";
import { suspendedFallback } from "~/components/suspense-wrapper";
import {
  TeamReadinessSkeleton,
  TeamsReadiness,
} from "~/components/team-readiness";
import type { WordId } from "~/db/database.gen";
import { useGameStateMutation } from "~/hooks/game/use-game-state";
import { useSubscribeToDefinitionReady } from "~/hooks/game/use-update-definition";
import { useWordPositions } from "~/hooks/game/use-word-positions";
import type { Game } from "~/hooks/use-game";
import { useGame } from "~/hooks/use-game";
import { useTRPC } from "~/utils/trpc";

const Definition: React.FC<{
  word: Game["words"][WordId];
  definitionHidden: boolean;
}> = ({ word, definitionHidden }) => {
  const { t } = useTranslation();
  return (
    <div className="relative flex">
      <Textarea
        label={t("pages.proposal.owner.termLabel", { term: word.term })}
        value={
          !definitionHidden
            ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              word.definition!
            : t("pages.proposal.owner.definitionMask")
        }
        isReadOnly
        classNames={{
          label: "overflow-visible text-2xl font-semibold tracking-tighter",
        }}
      />
    </div>
  );
};

const useWaitingTeams = () => {
  const trpc = useTRPC();
  const { id: gameId } = useGame();
  const { data: definitions } = useSuspenseQuery(
    trpc.definitions.getAdmin.queryOptions({ gameId }),
  );

  for (const word of values(definitions)) {
    for (const ready of values(word)) {
      if (!ready) {
        return true;
      }
    }
  }

  return false;
};

const ProposalReadiness = suspendedFallback<{
  wordId: WordId;
  teamsAmount: number;
}>(
  ({ wordId }) => {
    const trpc = useTRPC();
    const { id: gameId } = useGame();
    const { data: definitions } = useSuspenseQuery(
      trpc.definitions.getAdmin.queryOptions({ gameId }),
    );
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return <TeamsReadiness readiness={definitions[wordId]!} />;
  },
  ({ teamsAmount }) => <TeamReadinessSkeleton amount={teamsAmount} />,
);

const NextButton = suspendedFallback<{ word: Game["words"][WordId] }>(
  ({ word }) => {
    const isDisabled = useWaitingTeams();
    const { lastWordPosition } = useWordPositions();
    const { t } = useTranslation();
    const gameStateMutation = useGameStateMutation();
    const { id: gameId } = useGame();
    return (
      <Button
        color="primary"
        onPress={() =>
          gameStateMutation.mutate({ id: gameId, direction: "forward" })
        }
        isDisabled={isDisabled}
        className={word.position !== lastWordPosition ? "invisible" : undefined}
      >
        {t("components.nextPhase.button")}
      </Button>
    );
  },
  null,
);

export const ProposalPhaseOwner: React.FC<{
  wordId: WordId;
  word: Game["words"][WordId];
}> = ({ wordId, word }) => {
  useSubscribeToDefinitionReady();
  const [hideSensitiveData, setHideSensitiveData] = React.useState(false);
  const { teams } = useGame();

  return (
    <div className="flex flex-col gap-4">
      <PositionHeader
        hideSensitiveData={hideSensitiveData}
        setHideSensitiveData={setHideSensitiveData}
        nextControl={<NextButton word={word} />}
      />
      <Definition word={word} definitionHidden={hideSensitiveData} />
      <ProposalReadiness wordId={wordId} teamsAmount={keys(teams).length} />
    </div>
  );
};
