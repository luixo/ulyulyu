import React from "react";

import { Avatar, Button, Textarea } from "@heroui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { keys } from "remeda";

import { WordTracker } from "~/components/game/word-tracker";
import { suspendedFallback } from "~/components/suspense-wrapper";
import {
  TeamReadinessSkeleton,
  TeamsReadiness,
} from "~/components/team-readiness";
import { DEFINITIONS } from "~/db/const";
import {
  useSubscribeToDefinitionReady,
  useUpdateDefinitionMutation,
} from "~/hooks/game/use-update-definition";
import type { Game } from "~/hooks/use-game";
import { useGame } from "~/hooks/use-game";
import { useReadyAvatarProps } from "~/hooks/use-ready-avatar-props";
import type { WordId } from "~/server/validation";
import { useTRPC } from "~/utils/trpc";

const Definition: React.FC<{
  wordId: WordId;
  word: Game["words"][WordId];
}> = ({ wordId, word }) => {
  const { t } = useTranslation();
  const { id: gameId } = useGame();
  const updateDefinitionMutation = useUpdateDefinitionMutation();
  const [localDefinition, setLocalDefinition] = React.useState<string>(
    word.definition || "",
  );

  const readyAvatarProps = useReadyAvatarProps(true);

  return (
    <div className="relative flex">
      <Textarea
        label={t("pages.proposal.player.termLabel", { term: word.term })}
        value={localDefinition}
        onValueChange={setLocalDefinition}
        minLength={DEFINITIONS.TYPES.MIN_DEFINITION_LENGTH}
        maxLength={DEFINITIONS.TYPES.MAX_DEFINITION_LENGTH}
        classNames={{
          label: "overflow-visible text-2xl font-semibold tracking-tighter",
        }}
        endContent={
          <div className="flex self-end">
            {localDefinition === word.definition ||
            localDefinition.length < DEFINITIONS.TYPES.MIN_DEFINITION_LENGTH ||
            localDefinition.length > DEFINITIONS.TYPES.MAX_DEFINITION_LENGTH ? (
              word.definition === null ? (
                // Bug: https://github.com/nextui-org/nextui/issues/2069
                <div />
              ) : (
                <Avatar {...readyAvatarProps} />
              )
            ) : (
              <Button
                color="primary"
                onPress={() => () => {
                  const nextDefinition = localDefinition || "";
                  if (
                    word.definition === nextDefinition ||
                    nextDefinition.length <
                      DEFINITIONS.TYPES.MIN_DEFINITION_LENGTH ||
                    nextDefinition.length >
                      DEFINITIONS.TYPES.MAX_DEFINITION_LENGTH
                  ) {
                    return;
                  }
                  updateDefinitionMutation.mutate({
                    gameId,
                    wordId,
                    definition: nextDefinition,
                  });
                }}
              >
                {t("pages.start.words.saveButton")}
              </Button>
            )}
          </div>
        }
      />
    </div>
  );
};

const ProposalReadiness = suspendedFallback<{
  wordId: WordId;
  teamsAmount: number;
}>(
  ({ wordId }) => {
    const trpc = useTRPC();
    const { id: gameId } = useGame();
    const { data: definitions } = useSuspenseQuery(
      trpc.definitions.getPlayer.queryOptions({
        gameId,
      }),
    );
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return <TeamsReadiness readiness={definitions[wordId]!.readiness} />;
  },
  ({ teamsAmount }) => <TeamReadinessSkeleton amount={teamsAmount} />,
);

type InnerProps = {
  wordId: WordId;
  word: Game["words"][WordId];
};

export const ProposalPhasePlayer: React.FC<InnerProps> = ({ wordId, word }) => {
  const { teams } = useGame();
  useSubscribeToDefinitionReady();

  return (
    <div className="flex flex-col gap-4">
      <WordTracker />
      <Definition key={wordId} wordId={wordId} word={word} />
      <ProposalReadiness wordId={wordId} teamsAmount={keys(teams).length} />
    </div>
  );
};
