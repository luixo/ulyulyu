import React from "react";

import useTranslation from "next-translate/useTranslation";

import { ErrorMessage } from "@/components/error-message";
import { genericMemo } from "@/lib/utils";

type Props<T, K extends string = string> = {
	data: Record<K, T>;
	id: K;
	children: (datum: T) => React.ReactNode;
};

export const WithDefinition = genericMemo(
	// eslint-disable-next-line react-memo/require-memo
	<T,>({ data, id, children }: Props<T>) => {
		const { t } = useTranslation();
		const element = data[id];
		if (!element) {
			return (
				<ErrorMessage
					error={t("components.withDefinition.noDefinitionError", { id })}
				/>
			);
		}
		return <>{children(element)}</>;
	},
);
