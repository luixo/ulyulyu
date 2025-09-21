import React from "react";

import { Button, Skeleton } from "@heroui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { IoExtensionPuzzle as OpenBox } from "react-icons/io5";
import { entries, isNonNullish, keys, values } from "remeda";

import { ClickableIcon } from "~/components/base/clickable-icon";
import { PositionHeader } from "~/components/game/position-header";
import { ResultCard } from "~/components/game/result-card";
import { suspendedFallback } from "~/components/suspense-wrapper";
import { TeamReadiness } from "~/components/team-readiness";
import { useGameStateMutation } from "~/hooks/game/use-game-state";
import {
  useRevealWordMutation,
  useSubscribeToWordReveal,
} from "~/hooks/game/use-reveal-word";
import { useSubscribeToTeamVoted } from "~/hooks/game/use-vote";
import { useWordPositions } from "~/hooks/game/use-word-positions";
import type { Game } from "~/hooks/use-game";
import { useGame } from "~/hooks/use-game";
import type { WordId } from "~/server/validation";
import type { RouterOutput } from "~/utils/query";
import { useTRPC } from "~/utils/trpc";

type Guessing = RouterOutput["definitions"]["getAdminGuessing"];

const RevealButton: React.FC<{
  wordId: WordId;
  disabled: boolean;
}> = ({ wordId, disabled }) => {
  const { id: gameId } = useGame();
  const revealMutation = useRevealWordMutation();
  return (
    <ClickableIcon
      onClick={() => {
        revealMutation.mutate({ gameId, wordId });
      }}
      Component={OpenBox}
      size={32}
      disabled={disabled}
    />
  );
};

const TeamsDefinitions: React.FC<{
  word: Game["words"][WordId];
  hideSensitiveData: boolean;
  definitions: Guessing[WordId]["definitions"];
  readiness: Guessing[WordId]["readiness"];
}> = ({ word, hideSensitiveData, definitions, readiness }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      <ResultCard
        title={t("pages.guessing.owner.actualDefinition")}
        className="bg-content4"
      >
        <span>
          {hideSensitiveData
            ? t("pages.guessing.owner.definitionMask")
            : word.definition}
        </span>
      </ResultCard>
      {entries(definitions).map(([id, definition]) => (
        <ResultCard
          key={id}
          title={
            <TeamReadiness
              className="self-start"
              teamId={id}
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              ready={readiness[id]!}
            />
          }
        >
          <span>
            {hideSensitiveData
              ? t("pages.guessing.owner.definitionMask")
              : definition}
          </span>
        </ResultCard>
      ))}
    </div>
  );
};

const TeamGuesses: React.FC<{
  word: Game["words"][WordId];
  guessing: Guessing[WordId];
  revealMap: NonNullable<Guessing[WordId]["revealMap"]>;
}> = ({ word, guessing, revealMap }) => {
  const { t } = useTranslation();
  const teamsValues = values(revealMap).filter(isNonNullish);
  const { teams } = useGame();

  return (
    <div className="flex flex-col gap-2">
      <ResultCard
        title={t("pages.guessing.owner.actualDefinition")}
        className="bg-content4"
      >
        <span>{word.definition}</span>
      </ResultCard>
      {teamsValues.map(({ id, vote }) => {
        const believedByTeams = teamsValues.filter((team) => team.vote === id);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const votingTeam = teams[id]!;
        return (
          <>
            <ResultCard
              title={
                votingTeam
                  ? votingTeam.nickname
                  : t("pages.guessing.owner.actualDefinition")
              }
              points={
                (vote === null ? 1 : 0) +
                teamsValues.filter((team) => team.vote === id).length
              }
              footer={
                <div className="flex flex-col gap-1">
                  {vote === null ? (
                    <span className="text-success">
                      {t("pages.guessing.owner.successfulVote")}
                    </span>
                  ) : (
                    <span className="text-danger">
                      {t("pages.guessing.owner.failedVote", {
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        team: teams[vote]!.nickname,
                      })}
                    </span>
                  )}
                  {believedByTeams.length === 0 ? null : (
                    <i className="text-success">
                      {t("pages.guessing.owner.otherVote", {
                        count: believedByTeams.length,
                        teams: believedByTeams
                          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                          .map((team) => `"${teams[team.id]!.nickname}"`)
                          .join(", "),
                      })}
                    </i>
                  )}
                </div>
              }
            >
              {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
              <span>{guessing.definitions[id]!}</span>
            </ResultCard>
          </>
        );
      })}
    </div>
  );
};

const NextButton = suspendedFallback<{
  wordId: WordId;
  word: Game["words"][WordId];
}>(({ wordId, word }) => {
  const trpc = useTRPC();
  const { t } = useTranslation();
  const gameStateMutation = useGameStateMutation();
  const { id: gameId } = useGame();
  const { data: definitions } = useSuspenseQuery(
    trpc.definitions.getAdminGuessing.queryOptions({
      gameId,
    }),
  );
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const wordGuessing = definitions[wordId]!;
  const { lastWordPosition } = useWordPositions();
  const allTeamsReady = values(wordGuessing.readiness).every(Boolean);
  return (
    <Button
      color="primary"
      onPress={() => {
        gameStateMutation.mutate({ id: gameId, direction: "forward" });
      }}
      isDisabled={!allTeamsReady || !wordGuessing.revealMap}
      className={word.position !== lastWordPosition ? "invisible" : undefined}
    >
      {t("components.nextPhase.button")}
    </Button>
  );
}, null);

const NextArrow = suspendedFallback<{ wordId: WordId }>(({ wordId }) => {
  const trpc = useTRPC();
  const { id: gameId } = useGame();
  const { data: definitions } = useSuspenseQuery(
    trpc.definitions.getAdminGuessing.queryOptions({
      gameId,
    }),
  );
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const wordGuessing = definitions[wordId]!;
  const allTeamsReady = values(wordGuessing.readiness).every(Boolean);
  if (wordGuessing.revealMap) {
    return null;
  }
  return <RevealButton wordId={wordId} disabled={!allTeamsReady} />;
}, null);

const TeamsCard = suspendedFallback<{
  wordId: WordId;
  word: Game["words"][WordId];
  hideSensitiveData: boolean;
}>(
  ({ wordId, word, hideSensitiveData }) => {
    const trpc = useTRPC();
    const { id: gameId } = useGame();
    const { data: definitions } = useSuspenseQuery(
      trpc.definitions.getAdminGuessing.queryOptions({
        gameId,
      }),
    );
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const wordGuessing = definitions[wordId]!;
    if (wordGuessing.revealMap) {
      return (
        <TeamGuesses
          word={word}
          guessing={wordGuessing}
          revealMap={wordGuessing.revealMap}
        />
      );
    }
    return (
      <TeamsDefinitions
        word={word}
        hideSensitiveData={hideSensitiveData}
        definitions={wordGuessing.definitions}
        readiness={wordGuessing.readiness}
      />
    );
  },
  () => {
    const { teams } = useGame();
    return (
      <>
        <Skeleton className="h-24 w-full rounded-lg" />
        {Array.from({ length: keys(teams).length }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-lg" />
        ))}
      </>
    );
  },
);

type InnerProps = {
  wordId: WordId;
  word: Game["words"][WordId];
};

const GuessingPhaseOwnerInner: React.FC<InnerProps> = ({ wordId, word }) => {
  const [hideSensitiveData, setHideSensitiveData] = React.useState(false);
  return (
    <div className="flex flex-col gap-2">
      <div>
        <PositionHeader
          hideSensitiveData={hideSensitiveData}
          setHideSensitiveData={setHideSensitiveData}
          nextControl={<NextButton wordId={wordId} word={word} />}
        >
          <NextArrow wordId={wordId} />
        </PositionHeader>
        <span className="text-3xl">{word.term}</span>
      </div>
      <TeamsCard
        word={word}
        wordId={wordId}
        hideSensitiveData={hideSensitiveData}
      />
    </div>
  );
};

export const GuessingPhaseOwner: React.FC<{
  wordId: WordId;
  word: Game["words"][WordId];
}> = ({ wordId, word }) => {
  useSubscribeToWordReveal();
  useSubscribeToTeamVoted();

  return <GuessingPhaseOwnerInner wordId={wordId} word={word} />;
};
