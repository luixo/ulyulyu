import { type HTTPHeaders, httpBatchStreamLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";

import type { AppRouter } from "~/server/router";
import { transformer } from "~/utils/transformer";

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return "";
  }
  return `http://localhost:${process.env.PORT ?? 3000}`;
};

export const getLinks = ({
  headers,
  sourceType,
}: {
  headers: HTTPHeaders;
  sourceType: "csr" | "ssr" | "preload";
}) => [
  httpBatchStreamLink({
    url: `${getBaseUrl()}/api/trpc`,
    transformer,
    headers: () => ({
      ...headers,
      "x-source": sourceType,
    }),
  }),
];

export const { TRPCProvider, useTRPC, useTRPCClient } =
  createTRPCContext<AppRouter>();
