import { createIsomorphicFn } from "@tanstack/react-start";
import { httpBatchStreamLink } from "@trpc/client";
import type { HTTPHeaders } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import type { AppRouter } from "~/server/router";
import { transformer } from "~/utils/transformer";

const getBaseUrl = createIsomorphicFn()
	.server(() => {
		// This is server-only function
		// oxlint-disable-next-line node/no-process-env
		const { PORT = "3000" } = process.env;
		const portRaw = Math.trunc(Number(PORT));
		const port = Number.isNaN(portRaw) ? 3000 : portRaw;
		return `http://localhost:${port}`;
	})
	.client(() => "");

export const getLinks = ({
	headers,
	sourceType,
}: {
	headers: Exclude<HTTPHeaders, Iterable<unknown>>;
	sourceType: "csr" | "ssr" | "preload";
}) => [
	httpBatchStreamLink({
		headers: () => ({
			...headers,
			"x-source": sourceType,
		}),
		transformer,
		url: `${getBaseUrl()}/api/trpc`,
	}),
];

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();
