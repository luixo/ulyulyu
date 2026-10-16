import { Spinner } from "@heroui/react";
import {
	QueryClient,
	QueryClientProvider,
	dehydrate,
	hydrate,
} from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { serverOnly } from "@tanstack/react-start";
import { getWebRequest, setResponseHeader } from "@tanstack/react-start/server";
import { parse } from "cookie";
import { createInstance } from "i18next";
import { I18nextProvider } from "react-i18next";
import { clone } from "remeda";
import { DefaultCatchBoundary } from "~/components/default-catch-boundary";
import { NotFound } from "~/components/not-found";
import { getSetAuthCookie } from "~/server/auth";
import { upsertUser } from "~/server/user";
import type { UserId } from "~/server/validation";
import { USER_ID_COOKIE } from "~/utils/auth";
import {
	getBackendModule,
	getLanguageFromRequest,
	i18nInitOptions,
} from "~/utils/i18n";
import type { Language } from "~/utils/i18n";
import { queryClientConfig } from "~/utils/query";
import { YEAR } from "~/utils/time";
import { transformer } from "~/utils/transformer";
import { routeTree } from "./routeTree.gen";

const getUserId = (request: Request | null) => {
	const cookies = parse(
		request ? (request.headers.get("cookie") ?? "") : document.cookie,
	);
	const userIdCookie = cookies[USER_ID_COOKIE] ?? "";
	if (!userIdCookie) {
		if (typeof window === "undefined") {
			return crypto.randomUUID() as UserId;
		}
		throw new Error("Client should always have user cookie!");
	}
	return cookies[USER_ID_COOKIE] as UserId;
};

export const createRouter = async () => {
	const request = import.meta.env.SSR ? serverOnly(getWebRequest)() : null;
	const queryClient = new QueryClient(queryClientConfig);
	const i18nInstance =
		// Options are cloned because i18next mutates properties inline
		// causing different request to get same e.g. namespaces
		createInstance(clone(i18nInitOptions)).use(getBackendModule());

	const userId = getUserId(request);
	if (import.meta.env.SSR) {
		await serverOnly(async () => {
			// oxlint-disable-next-line typescript/no-non-null-assertion
			await upsertUser(userId, request!.headers.get("user-agent") ?? "unknown");
			setResponseHeader(
				"set-cookie",
				getSetAuthCookie(userId, new Date(Date.now() + YEAR)),
			);
		})();
	}
	const initialLanguage = getLanguageFromRequest(request);
	const router = createTanStackRouter({
		Wrap: ({ children }) => (
			<I18nextProvider i18n={i18nInstance}>
				<QueryClientProvider client={queryClient}>
					{children}
				</QueryClientProvider>
			</I18nextProvider>
		),
		context: {
			i18n: {
				initialLanguage,
				instance: i18nInstance,
			},
			queryClient,
			request,
			userId,
		},
		defaultErrorComponent: DefaultCatchBoundary,
		defaultNotFoundComponent: () => <NotFound />,
		defaultPendingComponent: Spinner,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
		// Don't rerun loaders on the client
		defaultStaleTime: Infinity,
		dehydrate: () => ({
			dehydratedState: dehydrate(queryClient, {
				serializeData: transformer.serialize,
			}),
			i18n: {
				data: i18nInstance.store.data,
				language: i18nInstance.language as Language,
			},
		}),
		hydrate: async (dehydratedData) => {
			await i18nInstance.init({
				lng: dehydratedData.i18n.language,
				resources: dehydratedData.i18n.data,
			});
			hydrate(queryClient, dehydratedData.dehydratedState, {
				defaultOptions: {
					deserializeData: transformer.deserialize,
				},
			});
		},
		routeTree,
	});

	return router;
};

declare module "@tanstack/react-router" {
	// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
	interface Register {
		router: Awaited<ReturnType<typeof createRouter>>;
	}
}
