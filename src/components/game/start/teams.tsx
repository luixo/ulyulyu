import React from "react";

import {
  Button,
  Card,
  CardBody,
  Divider,
  Input,
  Switch,
  Tooltip,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import {
  IoTrashOutline as KickIcon,
  IoCloseOutline as NotReadyIcon,
  IoCheckmarkOutline as ReadyIcon,
} from "react-icons/io5";
import { keys, mapValues, omitBy } from "remeda";

import { SaveAction } from "~/components/base/save-action";
import { ErrorMessage } from "~/components/error-message";
import { TeamsReadiness } from "~/components/team-readiness";
import { UserContext } from "~/contexts/user-id-context";
import { TEAMS } from "~/db/const";
import { useJoinMutation, useSubscribeToJoin } from "~/hooks/game/use-join";
import {
  useKickMutation,
  useLeaveMutation,
  useSubscribeToLeave,
} from "~/hooks/game/use-leave";
import {
  useStartGameMutation,
  useSubscribeToGameStart,
} from "~/hooks/game/use-start-game";
import {
  useSubscribeToTeamNicknameChange,
  useTeamNicknameChangeMutation,
} from "~/hooks/game/use-team-nickname-change";
import {
  useSubscribeToTeamReadyChange,
  useTeamReadinessChangeMutation,
} from "~/hooks/game/use-team-readiness-change";
import { useGame } from "~/hooks/use-game";
import type { UserId } from "~/server/validation";

const KickButton: React.FC<{
  teamId: UserId;
}> = ({ teamId }) => {
  const { t } = useTranslation();
  const { id: gameId } = useGame();
  const kickMutation = useKickMutation();
  return (
    <>
      <Button
        onPress={() => kickMutation.mutate({ gameId, teamId })}
        color="danger"
        isDisabled={kickMutation.status === "pending"}
        isLoading={kickMutation.status === "pending"}
        isIconOnly={kickMutation.status === "idle"}
        variant="bordered"
      >
        {kickMutation.status === "error" ? (
          t("common.tryAgain")
        ) : (
          <KickIcon size={24} />
        )}
      </Button>
      {kickMutation.status === "error" ? (
        <ErrorMessage error={kickMutation.error} />
      ) : null}
    </>
  );
};

const LeaveButton: React.FC<{
  leaveMutation: ReturnType<typeof useLeaveMutation>;
}> = ({ leaveMutation }) => {
  const { t } = useTranslation();
  const { id: gameId } = useGame();
  return (
    <>
      <Button
        color="danger"
        onPress={() => leaveMutation.mutate({ gameId })}
        isDisabled={leaveMutation.status === "pending"}
        isLoading={leaveMutation.status === "pending"}
      >
        {leaveMutation.status === "error"
          ? t("common.tryAgain")
          : t("pages.start.readiness.leaveButton")}
      </Button>
      {leaveMutation.status === "error" ? (
        <ErrorMessage error={leaveMutation.error} />
      ) : null}
    </>
  );
};

const JoinButton: React.FC<{
  nickname: string;
  joinMutation: ReturnType<typeof useJoinMutation>;
  isDisabled: boolean;
}> = ({ nickname, joinMutation, isDisabled }) => {
  const { t } = useTranslation();
  const { id: gameId } = useGame();
  return (
    <>
      <Button
        onPress={() => {
          if (
            nickname.length > TEAMS.TYPES.MAX_NAME_LENGTH ||
            nickname.length < TEAMS.TYPES.MIN_NAME_LENGTH
          ) {
            return;
          }
          joinMutation.mutate({ gameId, nickname });
        }}
        isDisabled={joinMutation.status === "pending" || isDisabled}
        isLoading={joinMutation.status === "pending"}
        color={joinMutation.status === "error" ? "danger" : "primary"}
      >
        {joinMutation.status === "error"
          ? t("common.tryAgain")
          : t("pages.start.teams.joinButton")}
      </Button>
      {joinMutation.status === "error" ? (
        <ErrorMessage error={joinMutation.error} />
      ) : null}
    </>
  );
};

const SelfTeamInput: React.FC<{
  nickname: string;
  setNickname: (nextNickname: string) => void;
  label?: string;
  isDisabled?: boolean;
  endContent?: React.ReactNode;
}> = ({ nickname, setNickname, label, endContent, isDisabled }) => {
  const { t } = useTranslation();
  return (
    <Input
      placeholder={t("pages.start.teams.placeholder")}
      size="sm"
      labelPlacement={label ? "outside" : undefined}
      label={label}
      value={nickname}
      onValueChange={setNickname}
      minLength={TEAMS.TYPES.MIN_NAME_LENGTH}
      maxLength={TEAMS.TYPES.MAX_NAME_LENGTH}
      isDisabled={isDisabled}
      endContent={endContent}
    />
  );
};

export const Teams = () => {
  const { t } = useTranslation();
  const { isOwner, id: gameId, teams, words } = useGame();
  const [{ id: selfUserId }] = React.use(UserContext);
  const selfTeam = teams[selfUserId];
  const [nickname, setNickname] = React.useState(selfTeam?.nickname ?? "");
  const joinMutation = useJoinMutation();
  const leaveMutation = useLeaveMutation();
  const teamReadinessChangeMutation = useTeamReadinessChangeMutation();
  useSubscribeToJoin();
  useSubscribeToLeave();
  useSubscribeToTeamReadyChange();
  useSubscribeToTeamNicknameChange();
  const startGameMutation = useStartGameMutation();
  useSubscribeToGameStart();
  const teamReadiness = mapValues(
    omitBy(teams, (_ready, teamId) => teamId === selfUserId),
    (team) => team.ready,
  );
  const teamNicknameChangeMutation = useTeamNicknameChangeMutation();
  const teamsAmount = keys(teams).length;
  const wordsAmount = keys(words).length;
  const canStartGame = teamsAmount >= 2 && wordsAmount >= 1;

  return (
    <Card>
      <CardBody className="flex flex-col gap-4">
        <div className="flex justify-between">
          <h2 className="text-2xl">{t("pages.start.teams.title")}</h2>
          {isOwner ? (
            <Tooltip
              content={
                teamsAmount < 2
                  ? t("pages.start.startButton.errors.noTeams")
                  : t("pages.start.startButton.errors.noWords")
              }
              isDisabled={canStartGame}
            >
              <Button
                color="primary"
                isDisabled={!canStartGame}
                onPress={() =>
                  startGameMutation.mutate({ id: gameId, teamIds: keys(teams) })
                }
                className="pointer-events-auto"
              >
                {t("pages.start.startButton.text")}
              </Button>
            </Tooltip>
          ) : selfTeam ? (
            <div className="flex items-center gap-2">
              <span>{t("pages.start.teams.readyPrompt")}</span>
              <Switch
                color="success"
                isSelected={selfTeam.ready}
                onValueChange={(nextValue: boolean) =>
                  teamReadinessChangeMutation.mutate({
                    gameId,
                    ready: nextValue,
                  })
                }
                thumbIcon={selfTeam.ready ? <ReadyIcon /> : <NotReadyIcon />}
              />
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          {isOwner ? null : (
            <>
              <Divider />
              {selfTeam ? (
                <div className="flex items-end gap-4">
                  <SelfTeamInput
                    nickname={nickname}
                    setNickname={setNickname}
                    isDisabled={teamNicknameChangeMutation.status === "pending"}
                    endContent={
                      <SaveAction
                        mutation={teamNicknameChangeMutation}
                        onClick={() => {
                          if (
                            nickname.length > TEAMS.TYPES.MAX_NAME_LENGTH ||
                            nickname.length < TEAMS.TYPES.MIN_NAME_LENGTH
                          ) {
                            return;
                          }
                          teamNicknameChangeMutation.mutate({
                            gameId,
                            nickname,
                          });
                        }}
                        isVisible={nickname !== selfTeam?.nickname}
                      />
                    }
                  />
                  <LeaveButton leaveMutation={leaveMutation} />
                </div>
              ) : (
                <>
                  <SelfTeamInput
                    nickname={nickname}
                    setNickname={setNickname}
                    label={t("pages.start.teams.joinInputLabel")}
                  />
                  <JoinButton
                    isDisabled={leaveMutation.status === "pending"}
                    joinMutation={joinMutation}
                    nickname={nickname}
                  />
                </>
              )}
            </>
          )}
          {keys(teamReadiness).length > 0 ? (
            <>
              {isOwner ? null : <Divider />}
              <TeamsReadiness
                readiness={teamReadiness}
                endContent={({ teamId }) =>
                  isOwner ? <KickButton teamId={teamId} /> : null
                }
              />
            </>
          ) : isOwner ? (
            <h3>{t("pages.start.emptyTitle")}</h3>
          ) : null}
        </div>
      </CardBody>
    </Card>
  );
};
