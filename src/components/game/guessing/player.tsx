import React from "react";

import { Radio, RadioGroup, Skeleton } from "@heroui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { entries, keys, omitBy } from "remeda";

import { ResultCard } from "~/components/game/result-card";
import { WordTracker } from "~/components/game/word-tracker";
import { suspendedFallback } from "~/components/suspense-wrapper";
import {
  TeamReadinessSkeleton,
  TeamsReadiness,
} from "~/components/team-readiness";
import { UserContext } from "~/contexts/user-id-context";
import { useSubscribeToWordReveal } from "~/hooks/game/use-reveal-word";
import {
  useSubscribeToTeamVoted,
  useVoteMutation,
} from "~/hooks/game/use-vote";
import type { Game } from "~/hooks/use-game";
import { useGame } from "~/hooks/use-game";
import type { WordId } from "~/server/validation";
import type { RouterOutput } from "~/utils/query";
import { useTRPC } from "~/utils/trpc";

type Guessing = RouterOutput["definitions"]["getPlayerGuessing"];

const Definition: React.FC<{
  revealMap: Guessing[WordId]["revealMap"];
  definition: string;
  maskedTeamId: string;
}> = ({ revealMap, maskedTeamId, definition }) => {
  const { t } = useTranslation();
  const { teams } = useGame();
  const revealData = revealMap ? revealMap[maskedTeamId] : undefined;
  const actualTeam = revealData?.id ? teams[revealData.id] : undefined;
  const color = revealMap
    ? actualTeam
      ? ("danger" as const)
      : ("success" as const)
    : undefined;
  return (
    <Radio
      key={maskedTeamId}
      value={maskedTeamId}
      color={color}
      classNames={{ labelWrapper: "ml-2" }}
    >
      {t("pages.guessing.player.guessDefinition", { definition })}
    </Radio>
  );
};

const TeamsDefinitions: React.FC<{
  word: Game["words"][WordId];
  wordId: WordId;
  definitions: Guessing[WordId];
}> = ({ word, wordId, definitions }) => {
  const { id: gameId } = useGame();

  const voteMutation = useVoteMutation();

  return (
    <RadioGroup
      value={definitions.vote || undefined}
      onValueChange={(guessUserId: string) =>
        voteMutation.mutate({ gameId, wordId, guessUserId })
      }
      isDisabled={Boolean(definitions.revealMap)}
    >
      <Radio value="-" isDisabled classNames={{ labelWrapper: "ml-2" }}>
        <span>{word.definition}</span>
      </Radio>
      {entries(definitions.definitions).map(([id, definition]) => (
        <Definition
          key={id}
          maskedTeamId={id}
          definition={definition}
          revealMap={definitions.revealMap}
        />
      ))}
    </RadioGroup>
  );
};

const TeamsResults: React.FC<{
  definitions: Guessing[WordId];
  revealMap: NonNullable<Guessing[WordId]["revealMap"]>;
  selfDefinition: string;
}> = ({ definitions, revealMap, selfDefinition }) => {
  const { t } = useTranslation();
  const { teams } = useGame();
  const [{ id: selfUserId }] = React.use(UserContext);
  const teamsEntries = entries(revealMap).sort(([, teamA], [, teamB]) => {
    if (teamA === null) {
      return -1;
    }
    if (teamB === null) {
      return 1;
    }
    if (teamA.id === selfUserId) {
      return -1;
    }
    if (teamB.id === selfUserId) {
      return 1;
    }
    return teamA.id.localeCompare(teamB.id);
  });

  const correctTeamId = teamsEntries.find(
    ([, lookupTeamValue]) => lookupTeamValue === null,
  )?.[0];
  const selfVoteCorrect = definitions.vote === correctTeamId;
  return (
    <>
      {teamsEntries.map(([maskedTeamId, teamValue]) => {
        if (!teamValue) {
          return (
            <ResultCard
              key={maskedTeamId}
              title={t("pages.guessing.player.originalDefinition")}
              footer={
                selfVoteCorrect ? (
                  <i className="text-success">
                    {t("pages.guessing.player.correctVote")}
                  </i>
                ) : null
              }
            >
              {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
              {definitions.definitions[maskedTeamId]!}
            </ResultCard>
          );
        }
        if (teamValue.id === selfUserId) {
          const foreignPoints =
            (selfVoteCorrect ? 1 : 0) +
            teamsEntries.filter(([, team]) => team?.vote === selfUserId).length;
          return (
            <ResultCard
              key={maskedTeamId}
              title={t("pages.guessing.player.selfDefinition")}
              points={foreignPoints}
              className="bg-content4"
            >
              {selfDefinition}
            </ResultCard>
          );
        }
        const points =
          (teamValue.vote === null ? 1 : 0) +
          teamsEntries.filter(([, team]) => team?.vote === teamValue.id).length;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const team = teams[teamValue.id]!;
        const theyVotedForUs = teamValue.vote === selfUserId;
        const weVotedForThem = definitions.vote === maskedTeamId;
        const appendix =
          theyVotedForUs && weVotedForThem ? (
            <i className="text-secondary">
              {t("pages.guessing.player.bilateralVote")}
            </i>
          ) : theyVotedForUs ? (
            <i className="text-success">
              {t("pages.guessing.player.foreignVotedForUs")}
            </i>
          ) : weVotedForThem ? (
            <i className="text-danger">
              {t("pages.guessing.player.foreignVotedForThem")}
            </i>
          ) : undefined;
        return (
          <ResultCard
            key={maskedTeamId}
            title={t("pages.guessing.player.foreignDefinition", {
              team: team.nickname,
            })}
            points={points}
            footer={appendix}
          >
            {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
            {definitions.definitions[maskedTeamId]!}
          </ResultCard>
        );
      })}
    </>
  );
};

const TeamsCard = suspendedFallback<Props>(
  ({ wordId, word }) => {
    const trpc = useTRPC();
    const { id: gameId } = useGame();
    const { data: definitions } = useSuspenseQuery(
      trpc.definitions.getPlayerGuessing.queryOptions({
        gameId,
      }),
    );
    const [{ id: selfUserId }] = React.use(UserContext);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const wordDefinitions = definitions[wordId]!;
    if (wordDefinitions.revealMap) {
      return (
        <TeamsResults
          definitions={wordDefinitions}
          revealMap={wordDefinitions.revealMap}
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          selfDefinition={word.definition!}
        />
      );
    }
    return (
      <div className="flex flex-col gap-6">
        <TeamsDefinitions
          definitions={wordDefinitions}
          word={word}
          wordId={wordId}
        />
        <TeamsReadiness
          readiness={omitBy(
            wordDefinitions.readiness,
            (_ready, teamId) => teamId === selfUserId,
          )}
        />
      </div>
    );
  },
  () => {
    const { words, teams } = useGame();
    return (
      <div className="flex flex-col gap-6">
        <RadioGroup isDisabled>
          {Array.from({ length: keys(words).length }).map((_, index) => (
            <Radio
              key={index}
              value=""
              isDisabled
              classNames={{ labelWrapper: "ml-2" }}
            >
              <Skeleton className="h-6 w-40 rounded-md" />
            </Radio>
          ))}
        </RadioGroup>
        <TeamReadinessSkeleton amount={keys(teams).length - 1} />
      </div>
    );
  },
);

type Props = {
  wordId: WordId;
  word: Game["words"][WordId];
};

export const GuessingPhasePlayer: React.FC<Props> = ({ wordId, word }) => {
  useSubscribeToTeamVoted();
  useSubscribeToWordReveal();
  return (
    <div className="flex flex-col gap-2">
      <WordTracker className="self-center" />
      <span className="text-3xl font-semibold">{word.term}</span>
      <TeamsCard wordId={wordId} word={word} />
    </div>
  );
};
