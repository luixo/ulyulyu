import { createFileRoute } from "@tanstack/react-router";

import { Page } from "~/pages/index";
import { getTrpcClient } from "~/utils/ssr";

export const Route = createFileRoute("/")({
  component: Page,
  loader: async ({ context }) => {
    const trpc = getTrpcClient(context);
    await context.queryClient.prefetchQuery(trpc.games.getAll.queryOptions());
  },
});
