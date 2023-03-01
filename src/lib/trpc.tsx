import { httpBatchLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import { SESSION_ID_HEADER, SESSION_ID_KEY } from "@/lib/cookie";
import type { AppRouter } from "@/server/router";

const getBaseUrl = () => {
	if (typeof window !== "undefined") {
		return "";
	}
	if (process.env.BASE_URL) {
		return process.env.BASE_URL;
	}
	throw new Error(
		'Expected to have "process.env.BASE_URL" environment variable',
	);
};

export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;

export const trpc = createTRPCNext<AppRouter>({
	config: () => ({
		links: [
			httpBatchLink({
				url: `${getBaseUrl()}/api/trpc`,
				headers: () => {
					if (typeof window === "undefined") {
						return {};
					}
					const sessionId = window.sessionStorage.getItem(SESSION_ID_KEY);
					if (!sessionId) {
						return {};
					}
					try {
						const sessionIdStringified = JSON.parse(sessionId);
						return {
							[SESSION_ID_HEADER]: sessionIdStringified,
						};
					} catch {
						return {};
					}
				},
			}),
		],
		queryClientConfig: {
			defaultOptions: {
				queries: {
					retry: false,
					staleTime: 60 * 1000,
					refetchOnWindowFocus: false,
					refetchOnMount: false,
				},
			},
		},
	}),
});
