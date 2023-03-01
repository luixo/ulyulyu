import React from "react";

import {
	Button,
	Divider,
	FormElement,
	Input,
	Loading,
	Spacer,
	Text,
	Checkbox,
} from "@nextui-org/react";
import useTranslation from "next-translate/useTranslation";
import { BsSave as SaveIcon, BsPlay as StartIcon } from "react-icons/bs";

import { Card } from "@/components/base/card";
import { ClickableIcon } from "@/components/base/clickable-icon";
import { ContentWrapper } from "@/components/base/content-wrapper";
import { Flex } from "@/components/base/flex";
import { ErrorMessage } from "@/components/error-message";
import { TEAMS } from "@/db/contants";
import { UsersId } from "@/db/models";
import { useJoinMutation, useSubscribeToJoin } from "@/hooks/game/use-join";
import {
	useLeaveMutation,
	useKickMutation,
	useSubscribeToLeave,
} from "@/hooks/game/use-leave";
import {
	useStartGameMutation,
	useSubscribeToGameStart,
} from "@/hooks/game/use-start-game";
import {
	useTeamNicknameChangeMutation,
	useSubscribeToTeamNicknameChange,
} from "@/hooks/game/use-team-nickname-change";
import {
	useSubscribeToTeamReadyChange,
	useTeamReadinessChangeMutation,
} from "@/hooks/game/use-team-readiness-change";
import { Game, useGame } from "@/hooks/use-game";
import { useSelfUserId } from "@/hooks/use-self-user-id";
import { getAvatar } from "@/lib/names";

const KickButton = React.memo<{
	teamId: UsersId;
}>(({ teamId }) => {
	const kickMutation = useKickMutation();
	const { t } = useTranslation();
	const { id: gameId } = useGame();
	const kick = React.useCallback(
		() => kickMutation.mutate({ gameId, teamId }),
		[kickMutation, teamId, gameId],
	);
	return (
		<>
			<Button onClick={kick} color="error" disabled={kickMutation.isLoading}>
				{kickMutation.status === "loading" ? (
					<Loading />
				) : kickMutation.status === "error" ? (
					t("common.tryAgain")
				) : (
					t("pages.start.readiness.kickButton")
				)}
			</Button>
			{kickMutation.status === "error" ? (
				<ErrorMessage error={kickMutation.error} />
			) : null}
		</>
	);
});

const LeaveButton = React.memo<{
	leaveMutation: ReturnType<typeof useLeaveMutation>;
	disabled: boolean;
}>(({ leaveMutation, disabled }) => {
	const { t } = useTranslation();
	const { id: gameId } = useGame();
	const leave = React.useCallback(
		() => leaveMutation.mutate({ gameId }),
		[leaveMutation, gameId],
	);
	return (
		<>
			<Button
				color="error"
				onClick={leave}
				disabled={leaveMutation.status === "loading" || disabled}
			>
				{leaveMutation.status === "loading" ? (
					<Loading color="currentColor" size="sm" />
				) : leaveMutation.status === "error" ? (
					t("common.tryAgain")
				) : (
					t("pages.start.readiness.leaveButton")
				)}
			</Button>
			{leaveMutation.status === "error" ? (
				<ErrorMessage error={leaveMutation.error} />
			) : null}
		</>
	);
});

const JoinButton = React.memo<{
	nickname: string;
	joinMutation: ReturnType<typeof useJoinMutation>;
	disabled: boolean;
}>(({ nickname, joinMutation, disabled }) => {
	const { t } = useTranslation();
	const { id: gameId } = useGame();
	const join = React.useCallback(() => {
		if (
			nickname.length > TEAMS.TYPES.MAX_NAME_LENGTH ||
			nickname.length < TEAMS.TYPES.MIN_NAME_LENGTH
		) {
			return;
		}
		joinMutation.mutate({ gameId, nickname });
	}, [joinMutation, gameId, nickname]);
	return (
		<>
			<Button
				onClick={join}
				disabled={joinMutation.status === "loading" || disabled}
				color={joinMutation.status === "error" ? "error" : undefined}
			>
				{joinMutation.status === "loading" ? (
					<Loading color="currentColor" size="sm" />
				) : joinMutation.status === "error" ? (
					t("common.tryAgain")
				) : (
					t("pages.start.teams.joinButton")
				)}
			</Button>
			{joinMutation.status === "error" ? (
				<ErrorMessage error={joinMutation.error} />
			) : null}
		</>
	);
});

const TeamReadiness = React.memo<{
	teamId: UsersId;
	team: Game["teams"][UsersId];
	leaveMutation: ReturnType<typeof useLeaveMutation>;
	disabled: boolean;
}>(({ teamId, team, leaveMutation, disabled }) => {
	const { isOwner, id: gameId, teams } = useGame();
	const selfUserId = useSelfUserId();
	return (
		<div>
			<Flex direction="row" mainAxis="spaceBetween">
				<Checkbox value={teamId} isDisabled={disabled || teamId !== selfUserId}>
					{getAvatar(teamId, gameId, team.nickname).name}
				</Checkbox>
				{isOwner ? (
					<KickButton teamId={teamId} />
				) : teamId === selfUserId ? (
					<LeaveButton leaveMutation={leaveMutation} disabled={disabled} />
				) : null}
			</Flex>
			<Spacer y={0.5} />
			{teamId === selfUserId && Object.keys(teams).length > 1 ? (
				<Divider />
			) : null}
			<Spacer y={0.5} />
		</div>
	);
});

const SelfTeamInput = React.memo<{
	nickname: string;
	onInputChange: React.ChangeEventHandler<FormElement>;
}>(({ nickname, onInputChange }) => {
	const { t } = useTranslation();
	const { id: gameId, teams } = useGame();
	const selfUserId = useSelfUserId();
	const selfTeam = teams[selfUserId];
	const changeTeamNicknameMutation = useTeamNicknameChangeMutation();
	const changeTeamNickname = React.useCallback(() => {
		if (
			nickname.length > TEAMS.TYPES.MAX_NAME_LENGTH ||
			nickname.length < TEAMS.TYPES.MIN_NAME_LENGTH
		) {
			return;
		}
		changeTeamNicknameMutation.mutate({ gameId, nickname });
	}, [changeTeamNicknameMutation, gameId, nickname]);
	return (
		<Input
			placeholder={t("pages.start.teams.placeholder")}
			label={t("pages.start.teams.changeInputLabel")}
			value={nickname}
			onChange={onInputChange}
			minLength={TEAMS.TYPES.MIN_NAME_LENGTH}
			maxLength={TEAMS.TYPES.MAX_NAME_LENGTH}
			disabled={changeTeamNicknameMutation.status === "loading"}
			// eslint-disable-next-line react-memo/require-usememo
			contentRight={
				<ContentWrapper>
					{changeTeamNicknameMutation.status === "loading" ? (
						<Loading color="currentColor" size="sm" />
					) : changeTeamNicknameMutation.status === "error" ? (
						<ErrorMessage error={changeTeamNicknameMutation.error} />
					) : nickname === selfTeam.nickname ? null : (
						<SaveIcon onClick={changeTeamNickname} />
					)}
				</ContentWrapper>
			}
			contentRightStyling={false}
		/>
	);
});

export const Teams = React.memo(() => {
	const { t } = useTranslation();
	const { isOwner, id: gameId, teams, words } = useGame();
	const selfUserId = useSelfUserId();
	const selfTeam = teams[selfUserId];
	const [nickname, setNickname] = React.useState(selfTeam?.nickname ?? "");
	const onInputChange = React.useCallback<
		React.ChangeEventHandler<FormElement>
	>((e) => setNickname(e.currentTarget.value), [setNickname]);
	const joinMutation = useJoinMutation();
	useSubscribeToJoin();
	const leaveMutation = useLeaveMutation();
	useSubscribeToLeave();
	const changeTeamReadinessMutation = useTeamReadinessChangeMutation();
	useSubscribeToTeamReadyChange();
	useSubscribeToTeamNicknameChange();
	const onTeamReadinessChange = React.useCallback<(value: string[]) => void>(
		(value) =>
			changeTeamReadinessMutation.mutate({
				gameId,
				ready: value.includes(selfUserId),
			}),
		[changeTeamReadinessMutation, gameId, selfUserId],
	);
	const startGameMutation = useStartGameMutation();
	useSubscribeToGameStart();
	const startGame = React.useCallback(() => {
		startGameMutation.mutate({ id: gameId, teamIds: Object.keys(teams) });
	}, [startGameMutation, gameId, teams]);

	return (
		<Card>
			<Flex direction="row" mainAxis="spaceBetween">
				<Text h2>{t("pages.start.teams.title")}</Text>
				{Object.keys(teams).length > 1 &&
				Object.keys(words).length > 1 &&
				isOwner ? (
					<ClickableIcon Component={StartIcon} size={40} onClick={startGame} />
				) : null}
			</Flex>
			{!isOwner ? (
				<>
					<Card>
						{selfTeam ? (
							<SelfTeamInput
								nickname={nickname}
								onInputChange={onInputChange}
							/>
						) : (
							<>
								<Input
									placeholder={t("pages.start.teams.placeholder")}
									label={t("pages.start.teams.joinInputLabel")}
									value={nickname}
									onChange={onInputChange}
									minLength={TEAMS.TYPES.MIN_NAME_LENGTH}
									maxLength={TEAMS.TYPES.MAX_NAME_LENGTH}
								/>
								<Spacer y={0.5} />
								<JoinButton
									disabled={leaveMutation.status === "loading"}
									joinMutation={joinMutation}
									nickname={nickname}
								/>
							</>
						)}
					</Card>
					<Spacer y={1} />
				</>
			) : null}
			{Object.keys(teams).length > 0 ? (
				<Checkbox.Group
					color="secondary"
					label={t("pages.start.readiness.title")}
					value={Object.entries(teams)
						.filter(([, { ready }]) => ready)
						.map(([id]) => id)}
					onChange={onTeamReadinessChange}
				>
					{Object.entries(teams)
						.sort(([aId], [bId]) =>
							aId === selfUserId ? -1 : bId === selfUserId ? 1 : 0,
						)
						.map(([id, team]) => (
							<TeamReadiness
								key={id}
								teamId={id}
								team={team}
								leaveMutation={leaveMutation}
								disabled={joinMutation.isLoading}
							/>
						))}
				</Checkbox.Group>
			) : (
				<Text h3>{t("pages.start.emptyTitle")}</Text>
			)}
		</Card>
	);
});
