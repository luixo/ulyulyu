import { addToast } from "@heroui/react";
import { MutationCache } from "@tanstack/react-query";
import type { QueryClientConfig } from "@tanstack/react-query";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "~/server/router";

export const queryClientConfig: QueryClientConfig = {
	defaultOptions: {
		queries: {
			refetchInterval: 30 * 1000,
			retry: 0,
			staleTime: 30 * 1000,
		},
	},
	mutationCache: new MutationCache({
		onError: (error) => {
			addToast({
				color: "danger",
				description: error.message,
				title: "Ошибка",
			});
		},
	}),
};

export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;
