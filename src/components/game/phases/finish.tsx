"use client";

import React from "react";

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { IoCheckmark as CheckIcon } from "react-icons/io5";
import { entries, isNonNullish, values } from "remeda";
import { twMerge } from "tailwind-merge";

import { ErrorMessage } from "~/components/error-message";
import { ResultCard } from "~/components/game/result-card";
import { suspendedFallback } from "~/components/suspense-wrapper";
import { UserContext } from "~/contexts/user-id-context";
import { useCreateGame } from "~/hooks/use-create-game";
import type { Game } from "~/hooks/use-game";
import { useGame } from "~/hooks/use-game";
import type { UserId } from "~/server/validation";
import type { RouterOutput } from "~/utils/query";
import { useTRPC } from "~/utils/trpc";

type GuessingData =
  | RouterOutput["definitions"]["getAdminGuessing"]
  | RouterOutput["definitions"]["getPlayerGuessing"];

const ResultCell: React.FC<{
  definition: string;
  voters: { id: UserId; nickname: string }[];
  selfVoteCorrect: boolean;
}> = ({ definition, voters, selfVoteCorrect }) => (
  <div className="max-h-52 w-52 overflow-y-scroll text-center">
    <div className="flex gap-1">
      {(selfVoteCorrect ? [...voters, selfVoteCorrect] : voters).map(
        (voter) => (
          <div
            key={typeof voter === "boolean" ? "correct" : voter.id}
            title={
              typeof voter === "boolean"
                ? "Correct vote"
                : `Voted by ${voter.nickname}`
            }
            className="flex h-3 w-3 shrink-0 items-center justify-center"
          >
            <CheckIcon
              className={twMerge(
                "text-background rounded-full",
                typeof voter === "boolean" ? "bg-success" : "bg-secondary",
              )}
              size={12}
            />
          </div>
        ),
      )}
    </div>
    {definition}
  </div>
);

const useItems = (data: GuessingData) => {
  const { isOwner, teams, words } = useGame();
  const [{ id: selfUserId }] = React.use(UserContext);
  return [
    ...entries(teams).sort(([teamAId], [teamBId]) => {
      if (teamAId === selfUserId) {
        return -1;
      }
      if (teamBId === selfUserId) {
        return 1;
      }
      return teamAId.localeCompare(teamBId);
    }),
    [null, { nickname: undefined }] as const,
  ].map(([teamId, team]) => ({
    id: teamId,
    nickname: team.nickname,
    definitions: entries(words).map(([wordId, word]) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const wordDefinition = data[wordId]!;
      if (!("revealMap" in wordDefinition) || !wordDefinition.revealMap) {
        throw new Error(
          `Expected to have reveal map for word "${word.term}" (id "${wordId}")`,
        );
      }
      const revealValues = values(wordDefinition.revealMap);
      const selfVote = revealValues.find(
        (value) => value && value.id === teamId,
      );
      const selfVoteCorrect = selfVote ? selfVote.vote === null : false;
      const voters = revealValues
        .filter((value) => (value ? value.vote === teamId : null))
        .filter(isNonNullish)
        .map((value) => ({
          id: value.id,
          nickname: teams[value.id]?.nickname ?? "unknown",
        }));
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
              ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                word.definition!
              : wordDefinition.definitions[teamId],
          voters,
          selfVoteCorrect,
        };
      }
      if (!selfUserId) {
        throw new Error(
          `Expected to have selfUserId as not an owner of the game`,
        );
      }
      const revealData = entries(wordDefinition.revealMap).find(
        ([, revealDatum]) => (revealDatum ? revealDatum.id : null) === teamId,
      );
      if (!revealData) {
        throw new Error(
          `Expected to have reveal map for team "${team.nickname}" (id "${teamId}")`,
        );
      }
      const [obfuscatedTeamId] = revealData;
      return {
        id: wordId,
        definition:
          selfUserId === teamId
            ? word.definition
            : (wordDefinition.definitions as Record<string, string>)[
                obfuscatedTeamId
              ],
        voters,
        selfVoteCorrect,
      };
    }),
  }));
};

const getColumns = (
  words: Game["words"],
): [string, { term: string; firstColumn?: boolean }][] => [
  ["*", { term: "*" }],
  ...entries(words).sort(
    ([, wordA], [, wordB]) => wordA.position - wordB.position,
  ),
];

const ResultsTable = suspendedFallback(
  () => {
    const trpc = useTRPC();
    const { id: gameId, isOwner } = useGame();
    const { data: guessing } = isOwner
      ? useSuspenseQuery(
          trpc.definitions.getAdminGuessing.queryOptions({ gameId }),
        )
      : useSuspenseQuery(
          trpc.definitions.getPlayerGuessing.queryOptions({ gameId }),
        );
    const { t } = useTranslation();
    const { words, teams } = useGame();
    const columns = getColumns(words);
    const items = useItems(guessing);
    const [{ id: selfUserId }] = React.use(UserContext);
    const [selectedCell, setSelectedCell] = React.useState<
      | ((typeof items)[number]["definitions"][number] & {
          team: {
            id: UserId;
            nickname: string;
          } | null;
        })
      | undefined
    >();
    return (
      <>
        <Table aria-label="Results" isStriped>
          <TableHeader columns={columns}>
            {([wordId, { term, firstColumn }]) => (
              <TableColumn
                key={wordId}
                className={firstColumn ? "text-left" : "text-center"}
              >
                {term}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody items={items}>
            {({ id: teamId, nickname, definitions }) => (
              <TableRow key={teamId}>
                {(columnKey) => {
                  const tableCellClass =
                    teamId === selfUserId
                      ? "before:bg-content4 before:opacity-100"
                      : undefined;
                  if (columnKey === "*") {
                    return (
                      <TableCell
                        className={twMerge(
                          "overflow-hidden text-right",
                          tableCellClass,
                        )}
                      >
                        {nickname
                          ? t("pages.finish.rowName", {
                              team: nickname,
                              points: t("points", {
                                count: definitions.reduce(
                                  (acc, definition) =>
                                    acc +
                                    definition.voters.length +
                                    (definition.selfVoteCorrect ? 1 : 0),
                                  0,
                                ),
                              }),
                            })
                          : t("pages.finish.actualTeamNickname")}
                      </TableCell>
                    );
                  }
                  const cellDefinition =
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    definitions.find(({ id }) => id === columnKey)!;
                  const { definition, voters, selfVoteCorrect } =
                    cellDefinition;
                  return (
                    <TableCell
                      className={twMerge(
                        "cursor-pointer overflow-hidden text-center",
                        tableCellClass,
                      )}
                      onClick={() => {
                        setSelectedCell({
                          ...cellDefinition,
                          team:
                            teamId && nickname
                              ? { id: teamId, nickname }
                              : null,
                        });
                      }}
                    >
                      <ResultCell
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        definition={definition!}
                        voters={teamId ? voters : []}
                        selfVoteCorrect={teamId ? selfVoteCorrect : false}
                      />
                    </TableCell>
                  );
                }}
              </TableRow>
            )}
          </TableBody>
        </Table>
        <Modal
          isOpen={Boolean(selectedCell)}
          onOpenChange={() => setSelectedCell(undefined)}
          placement="center"
          hideCloseButton
        >
          <ModalContent>
            <ModalBody className="p-0">
              {selectedCell ? (
                <ResultCard
                  title={
                    selectedCell.team
                      ? selectedCell.team.nickname
                      : t("pages.finish.actualTeamNickname")
                  }
                  footer={
                    <div className="flex flex-col gap-1">
                      {selectedCell.selfVoteCorrect ? (
                        <span className="text-success">
                          {t("pages.guessing.owner.successfulVote")}
                        </span>
                      ) : null}
                      {selectedCell.voters.length !== 0 ? (
                        <i className="text-secondary">
                          {t("pages.guessing.owner.otherVote", {
                            count: selectedCell.voters.length,
                            teams: selectedCell.voters
                              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                              .map((team) => `"${teams[team.id]!.nickname}"`)
                              .join(", "),
                          })}
                        </i>
                      ) : null}
                    </div>
                  }
                >
                  <span>{selectedCell.definition}</span>
                </ResultCard>
              ) : null}
            </ModalBody>
          </ModalContent>
        </Modal>
      </>
    );
  },
  () => {
    const { t } = useTranslation();
    const { words, teams } = useGame();
    const columns = getColumns(words);
    const items = [
      ...entries(teams).map(([teamId, team]) => ({
        teamId,
        team,
      })),
      { teamId: null, team: null },
    ];
    return (
      <Table isStriped>
        <TableHeader columns={columns}>
          {([wordId, { term, firstColumn }]) => (
            <TableColumn
              key={wordId}
              className={firstColumn ? "text-left" : "text-center"}
            >
              {term}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={items}>
          {(item) => (
            <TableRow key={item.teamId}>
              {(columnKey) => (
                <TableCell
                  className={columnKey === "*" ? "text-right" : undefined}
                >
                  {columnKey === "*" ? (
                    (item.team?.nickname ??
                    t("pages.finish.actualTeamNickname"))
                  ) : (
                    <Skeleton className="h-24 w-48 rounded-md" />
                  )}
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  },
);

const StartNewGameButton = () => {
  const { t } = useTranslation();
  const createGameMutation = useCreateGame();
  return (
    <>
      <Button
        onPress={() => {
          createGameMutation.mutate();
        }}
        isDisabled={
          createGameMutation.status === "pending" ||
          createGameMutation.status === "success"
        }
        isLoading={createGameMutation.status === "pending"}
        color={createGameMutation.status === "error" ? "danger" : "primary"}
      >
        {createGameMutation.status === "error"
          ? t("common.tryAgain")
          : createGameMutation.status === "success"
            ? t("pages.finish.newGame.success")
            : t("pages.finish.newGame.button")}
      </Button>
      {createGameMutation.status === "error" ? (
        <ErrorMessage error={createGameMutation.error} />
      ) : null}
    </>
  );
};

const ToIndexButton = () => {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <Button onPress={() => router.navigate({ to: "/" })}>
      {t("pages.finish.back.button")}
    </Button>
  );
};

type Props = {
  state: Extract<Game["state"], { phase: "finish" }>;
};

export const FinishPhase: React.FC<Props> = () => (
  <div className="flex flex-col gap-2">
    <ResultsTable />
    <StartNewGameButton />
    <ToIndexButton />
  </div>
);
