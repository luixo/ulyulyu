import { createFileRoute } from "@tanstack/react-router";
import { doNothing } from "remeda";
import { Page } from "~/pages/index";
import { getTrpcClient } from "~/utils/ssr";

export const Route = createFileRoute("/")({
	component: Page,
	loader: async ({ context }) => {
		const trpc = getTrpcClient(context);
		await context.queryClient
			.query(trpc.games.getAll.queryOptions())
			.catch(doNothing());
	},
});
