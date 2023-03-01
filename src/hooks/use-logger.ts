import React from "react";

import { useRouter } from "next/router";

export const useLogger = () => {
	const router = useRouter();
	return React.useCallback(
		(message: string) => {
			if (router.query.debug) {
				// eslint-disable-next-line no-console
				console.log(`[DEBUG]: ${message}`);
			}
		},
		[router],
	);
};
