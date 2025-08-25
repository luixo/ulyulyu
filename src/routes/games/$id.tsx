import { createFileRoute, redirect } from "@tanstack/react-router";

import { Page } from "~/pages/game";
import type { GameId } from "~/server/validation";
import { getTrpcClient } from "~/utils/ssr";

const Wrapper = () => {
  const { id } = Route.useParams();
  return <Page id={id as GameId} />;
};
export const Route = createFileRoute("/games/$id")({
  component: Wrapper,
  loader: async ({ context, params }) => {
    const trpc = getTrpcClient(context);
    try {
      await context.queryClient.fetchQuery(
        trpc.games.get.queryOptions({ id: params.id as GameId }),
      );
    } catch {
      throw redirect({ to: "/" });
    }
  },
});
