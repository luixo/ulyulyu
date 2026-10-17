import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createTRPCClient } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { fromEntries } from "remeda";
import type { RouterContext } from "~/routes/__root";
import type { AppRouter } from "~/server/router";
import { getLinks } from "~/utils/trpc";
import { USER_ID_COOKIE } from "./auth";

const getHeaders = createIsomorphicFn()
	.server(() => {
		const request = getRequest();
		return fromEntries([...request.headers.entries()]);
	})
	.client((): Record<string, string | undefined> => ({}));

export const getTrpcClient = (ctx: RouterContext) => {
	const headers = getHeaders();
	return createTRPCOptionsProxy<AppRouter>({
		client: createTRPCClient<AppRouter>({
			links: getLinks({
				headers: {
					...headers,
					cookie: [headers.cookie, `${USER_ID_COOKIE}=${ctx.userId}`]
						.filter(Boolean)
						.join(";"),
				},
				sourceType: "preload",
			}),
		}),
		queryClient: ctx.queryClient,
	});
};
