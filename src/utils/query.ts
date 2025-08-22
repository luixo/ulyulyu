import { addToast } from "@heroui/react";
import { MutationCache, type QueryClientConfig } from "@tanstack/react-query";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "~/server/router";

export const queryClientConfig: QueryClientConfig = {
  mutationCache: new MutationCache({
    onError: (error) => {
      addToast({
        title: "Ошибка",
        description: error.message,
        color: "danger",
      });
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 0,
      refetchInterval: 30 * 1000,
    },
  },
};

export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;
