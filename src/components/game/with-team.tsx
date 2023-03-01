import React from "react";

import useTranslation from "next-translate/useTranslation";

import { ErrorMessage } from "@/components/error-message";
import { genericMemo } from "@/lib/utils";

type Props<T extends Record<string, unknown>> = {
	data: T;
	id: string;
	children: (datum: Exclude<T[keyof T], undefined>) => React.ReactNode;
};

export const WithTeam = genericMemo(
	// eslint-disable-next-line react-memo/require-memo
	<T extends Record<string, unknown>>({ data, id, children }: Props<T>) => {
		const { t } = useTranslation();
		const element = data[id];
		if (element === undefined) {
			return (
				<ErrorMessage error={t("components.withTeam.noTeamError", { id })} />
			);
		}
		return <>{children(element as Exclude<T[keyof T], undefined>)}</>;
	},
);
