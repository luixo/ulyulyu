/// <reference types="vite/client" />

import React from "react";

import { HeroUIProvider, ToastProvider } from "@heroui/react";
import type { QueryClient } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { createTRPCClient } from "@trpc/client";
import type { i18n } from "i18next";
import { useSessionStorage } from "usehooks-ts";
import { z } from "zod";

import { Devtools } from "~/components/devtools";
import { SessionContext } from "~/contexts/session-context";
import { UserContext } from "~/contexts/user-id-context";
import { getAuthCookie } from "~/server/auth";
import type { AppRouter } from "~/server/router";
import type { UserId } from "~/server/validation";
import appCss from "~/styles/app.css?url";
import { SESSION_ID_HEADER, SESSION_ID_KEY } from "~/utils/auth";
import type { Language } from "~/utils/i18n";
import { getTrpcClient } from "~/utils/ssr";
import { TRPCProvider, getLinks } from "~/utils/trpc";

const RootComponent = () => {
  const { user } = Route.useLoaderData();
  const queryClient = useQueryClient();
  const [sessionId, setSessionId] = useSessionStorage(
    SESSION_ID_KEY,
    `session-${Math.random()}`,
  );
  React.useEffect(() => {
    setSessionId(sessionId);
  }, [sessionId, setSessionId]);
  const [trpcClient] = React.useState(() =>
    createTRPCClient<AppRouter>({
      links: getLinks(
        typeof window === "undefined"
          ? {
              sourceType: "ssr",
              headers: {
                [SESSION_ID_HEADER]: sessionId,
                cookie: getAuthCookie(user.id),
              },
            }
          : {
              sourceType: "csr",
              headers: { [SESSION_ID_HEADER]: sessionId },
            },
      ),
    }),
  );
  return (
    <TRPCProvider queryClient={queryClient} trpcClient={trpcClient}>
      <SessionContext.Provider value={sessionId}>
        <UserContext.Provider value={user}>
          <HeroUIProvider>
            <Outlet />
            <ToastProvider />
            <Devtools />
          </HeroUIProvider>
        </UserContext.Provider>
      </SessionContext.Provider>
    </TRPCProvider>
  );
};

export type RouterContext = {
  request: Request | null;
  userId: UserId;
  queryClient: QueryClient;
  i18n: {
    instance: i18n;
    initialLanguage: Language;
  };
};

export const Route = createRootRouteWithContext<RouterContext>()({
  validateSearch: z.object({
    debug: z.coerce.boolean().optional().catch(false),
  }),
  loader: async ({ context }) => {
    const { queryClient, i18n, userId } = context;
    const i18nPromise = i18n.instance
      .init({ lng: i18n.initialLanguage })
      .then(() => i18n.instance.loadNamespaces("default"));
    const trpc = getTrpcClient(context);
    const [user] = await Promise.all([
      queryClient.fetchQuery(trpc.users.upsert.queryOptions({ id: userId })),
      i18nPromise,
    ]);
    return { user };
  },
  component: RootComponent,
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      { title: "Игра Улюлю" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/favicon-32x32.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "/favicon-16x16.png",
      },
      { rel: "manifest", href: "/site.webmanifest", color: "#fffff" },
      { rel: "icon", href: "/favicon.ico" },
    ],
  }),
  shellComponent: ({ children }) => (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="p-4">
        <main>{children}</main>
        <Scripts />
      </body>
    </html>
  ),
});
