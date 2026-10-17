import { createFileRoute } from "@tanstack/react-router";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "~/server/router";

const callback = async (request: Request) =>
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

export const Route = createFileRoute("/api/trpc/$")({
	server: {
		handlers: {
			GET: ({ request }) => callback(request),
			POST: ({ request }) => callback(request),
		},
	},
});
