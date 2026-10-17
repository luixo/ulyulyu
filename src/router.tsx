import { Spinner } from "@heroui/react";
import {
	QueryClient,
	QueryClientProvider,
	dehydrate,
	hydrate,
} from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createInstance } from "i18next";
import { I18nextProvider } from "react-i18next";
import { clone } from "remeda";
import { DefaultCatchBoundary } from "~/components/default-catch-boundary";
import { NotFound } from "~/components/not-found";
import { upsertUser } from "~/server/user";
import type { UserId } from "~/server/validation";
import { USER_ID_COOKIE } from "~/utils/auth";
import {
	getBackendModule,
	getInitialLanguage,
	i18nInitOptions,
} from "~/utils/i18n";
import type { Language } from "~/utils/i18n";
import { queryClientConfig } from "~/utils/query";
import { transformer } from "~/utils/transformer";
import { routeTree } from "./routeTree.gen";
import { setAuthCookie } from "./server/auth";
import { getCookies } from "./utils/cookie";

const getUserId = (cookies: Record<string, string | undefined>) => {
	const userIdCookie = cookies[USER_ID_COOKIE] ?? "";
	if (!userIdCookie) {
		if (typeof window === "undefined") {
			return crypto.randomUUID() as UserId;
		}
		throw new Error("Client should always have user cookie!");
	}
	return cookies[USER_ID_COOKIE] as UserId;
};

const getUserAgent = createIsomorphicFn()
	.server(() => {
		const request = getRequest();
		return request.headers.get("user-agent") ?? "unknown";
	})
	.client(() => navigator.userAgent);

const upsertAuth = createIsomorphicFn()
	.server(async (userId: UserId) => {
		await upsertUser(userId, getUserAgent());
		setAuthCookie(userId);
	})
	.client(() => {
		/*empty*/
	});

export const getRouter = async () => {
	const queryClient = new QueryClient(queryClientConfig);
	const i18nInstance =
		// Options are cloned because i18next mutates properties inline
		// causing different request to get same e.g. namespaces
		createInstance(clone(i18nInitOptions)).use(getBackendModule());

	const cookies = await getCookies();
	const userId = getUserId(cookies);
	await upsertAuth(userId);
	const initialLanguage = await getInitialLanguage();
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
			userId,
		},
		defaultErrorComponent: DefaultCatchBoundary,
		defaultNotFoundComponent: () => <NotFound />,
		defaultPendingComponent: Spinner,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
		// Don't rerun loaders on the client
		defaultStaleTime: Infinity,
		// @ts-expect-error TODO: migrate to a package
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
