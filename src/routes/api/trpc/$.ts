import type {
	ServerFileRoutesByPath,
	ServerRouteMethodRecordValue,
} from "@tanstack/react-start/server";
import { createServerFileRoute } from "@tanstack/react-start/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "~/server/router";

type Callback = Extract<
	ServerRouteMethodRecordValue<
		ServerFileRoutesByPath["/api/trpc/$"]["parentRoute"],
		"/api/trpc/$",
		undefined
	>,
	// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type typescript/ban-types
	Function
>;

const callback: Callback = async ({ request }) =>
	fetchRequestHandler({
		createContext: (opts) => opts,
		endpoint: "/api/trpc",
		onError: ({ error, type, path, ctx }) => {
			if (!ctx) {
				return;
			}
			// oxlint-disable-next-line no-console
			console.error(
				`[${error.code}] [${
					ctx.req.headers.get("user-agent") ?? "no-user-agent"
				}] ${type} "${path}": ${error.message}`,
			);
		},
		req: request,
		router: appRouter,
	});

export const ServerRoute = createServerFileRoute("/api/trpc/$").methods({
	GET: callback,
	POST: callback,
});
