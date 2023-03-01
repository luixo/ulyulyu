import React from "react";

import { Text, Checkbox } from "@nextui-org/react";
import useTranslation from "next-translate/useTranslation";

import { ErrorMessage } from "@/components/error-message";
import { UsersId } from "@/db/models";
import { useGame } from "@/hooks/use-game";

type Props = {
	readiness: Record<UsersId, boolean>;
};

export const TeamsReadiness = React.memo<Props>(({ readiness }) => {
	const { t } = useTranslation();
	const { teams } = useGame();
	return (
		<>
			<Text h3>{t("components.readiness.title")}</Text>
			{Object.entries(readiness).map(([teamId, ready]) => {
				const team = teams[teamId];
				if (!team) {
					return (
						<ErrorMessage
							key={teamId}
							error={t("components.readiness.noTeamError", { id: teamId })}
						/>
					);
				}
				return (
					<Checkbox.Group
						key={teamId}
						value={ready ? [teamId] : []}
						isReadOnly
						aria-label={t("components.readiness.teamLabel", {
							team: team.nickname,
						})}
					>
						<Checkbox
							value={teamId}
							label={t("components.readiness.teamLabel", {
								team: team.nickname,
							})}
						/>
					</Checkbox.Group>
				);
			})}
		</>
	);
});
