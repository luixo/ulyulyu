import React from "react";

import { Spinner } from "@nextui-org/react";
import { UseQueryResult } from "@tanstack/react-query";

import { ErrorMessage } from "@/components/error-message";
import { genericMemo } from "@/lib/utils";

type Props<D, E = unknown> = {
	query: UseQueryResult<D, E>;
	children: (data: D) => React.ReactNode;
	errorChildren?: (error: E) => React.ReactNode;
	loadingChildren?: () => React.ReactNode;
};

export const WithQuery = genericMemo(
	// eslint-disable-next-line react-memo/require-memo
	<D, E = unknown>({
		query,
		children,
		errorChildren,
		loadingChildren,
	}: Props<D, E>) => {
		switch (query.status) {
			case "loading": {
				if (loadingChildren) {
					return <>{loadingChildren()}</>;
				}
				return <Spinner />;
			}
			case "error": {
				if (errorChildren) {
					return <>{errorChildren(query.error)}</>;
				}
				return <ErrorMessage error={query.error} />;
			}
			case "success":
				return <>{children(query.data)}</>;
		}
	},
);
