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
import i18n from "i18next";
import { I18nextProvider } from "react-i18next";
import { clone } from "remeda";

import { DefaultCatchBoundary } from "~/components/default-catch-boundary";
import { NotFound } from "~/components/not-found";
import { getSetAuthCookie } from "~/server/auth";
import { upsertUser } from "~/server/user";
import type { UserId } from "~/server/validation";
import { USER_ID_COOKIE } from "~/utils/auth";
import {
  type Language,
  getBackendModule,
  getLanguageFromRequest,
  i18nInitOptions,
} from "~/utils/i18n";
import { queryClientConfig } from "~/utils/query";
import { YEAR } from "~/utils/time";
import { transformer } from "~/utils/transformer";

import { routeTree } from "./routeTree.gen";

const getUserId = (request: Request | null) => {
  const cookies = parse(
    request ? request.headers.get("cookie") || "" : document.cookie,
  );
  if (!cookies[USER_ID_COOKIE]) {
    if (typeof window === "undefined") {
      return crypto.randomUUID() as UserId;
    } else {
      throw new Error("Client should always have user cookie!");
    }
  }
  return cookies[USER_ID_COOKIE] as UserId;
};

export const createRouter = async () => {
  const request = import.meta.env.SSR ? serverOnly(getWebRequest)() : null;
  const queryClient = new QueryClient(queryClientConfig);
  const i18nInstance = i18n
    // Options are cloned because i18next mutates properties inline
    // causing different request to get same e.g. namespaces
    .createInstance(clone(i18nInitOptions))
    .use(getBackendModule());

  const userId = getUserId(request);
  if (import.meta.env.SSR) {
    await serverOnly(async () => {
      const request = getWebRequest();
      await upsertUser(userId, request.headers.get("user-agent") || "unknown");
      setResponseHeader(
        "set-cookie",
        getSetAuthCookie(userId, new Date(Date.now() + YEAR)),
      );
    })();
  }
  const initialLanguage = getLanguageFromRequest(request);
  const router = createTanStackRouter({
    context: {
      userId,
      request,
      queryClient,
      i18n: {
        instance: i18nInstance,
        initialLanguage,
      },
    },
    dehydrate: () => ({
      dehydratedState: dehydrate(queryClient, {
        serializeData: transformer.serialize,
      }),
      i18n: {
        language: i18nInstance.language as Language,
        data: i18nInstance.store?.data,
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
    defaultPreload: "intent",
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: () => <NotFound />,
    defaultPendingComponent: Spinner,
    // Don't rerun loaders on the client
    defaultStaleTime: Infinity,
    defaultPreloadStaleTime: 0,
    Wrap: ({ children }) => (
      <I18nextProvider i18n={i18nInstance}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </I18nextProvider>
    ),
  });

  return router;
};

declare module "@tanstack/react-router" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Register {
    router: Awaited<ReturnType<typeof createRouter>>;
  }
}
