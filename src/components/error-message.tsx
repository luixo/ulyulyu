import React from "react";

import { styled } from "@nextui-org/react";
import useTranslation from "next-translate/useTranslation";

import { Card } from "@/components/base/card";

const ErrorCard = styled(Card, {
	borderColor: "red",
});

type Props = {
	error: unknown;
};

export const ErrorMessage = React.memo<Props>(({ error }) => {
	const { t } = useTranslation();
	return (
		<ErrorCard>
			{t("common.error", {
				error:
					typeof error === "string"
						? error
						: typeof error === "object" && error instanceof Error
						  ? (error as Error).message
						  : JSON.stringify(error, null, 4),
			})}
		</ErrorCard>
	);
});
