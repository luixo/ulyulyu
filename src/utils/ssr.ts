import { createTRPCClient } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { fromEntries } from "remeda";
import type { RouterContext } from "~/routes/__root";
import { getAuthCookie } from "~/server/auth";
import type { AppRouter } from "~/server/router";
import { getLinks } from "~/utils/trpc";

export const getTrpcClient = (ctx: RouterContext) => {
	const headers = fromEntries([...(ctx.request?.headers.entries() ?? [])]);
	return createTRPCOptionsProxy<AppRouter>({
		client: createTRPCClient<AppRouter>({
			links: getLinks({
				headers: {
					...headers,
					cookie: [headers.cookie, getAuthCookie(ctx.userId)]
						.filter(Boolean)
						.join(";"),
				},
				sourceType: "preload",
			}),
		}),
		queryClient: ctx.queryClient,
	});
};
