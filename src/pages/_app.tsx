import React from "react";

import { styled, globalCss, NextUIProvider, Loading } from "@nextui-org/react";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { getCookies } from "cookies-next";
import { enablePatches } from "immer";
import type { AppType } from "next/app";
import { Inter } from "next/font/google";

import { userContext } from "@/contexts/user-id-context";
import { useUser } from "@/hooks/use-user";
import { USER_ID_COOKIE } from "@/lib/cookie";
import { trpc } from "@/lib/trpc";

enablePatches();

const inter = Inter({ subsets: ["latin"] });

const Main = styled("main", {
	padding: 20,
	display: "flex",
	flexDirection: "column",
});
const globalStyles = globalCss({
	body: { margin: 0 },
});

type AppProps = { userIdCookie?: string };

const MyApp: AppType<AppProps> = React.memo(({ Component, pageProps }) => {
	globalStyles();
	const user = useUser(pageProps.userIdCookie);
	return (
		<NextUIProvider>
			<userContext.Provider value={user}>
				<Main className={inter.className}>
					{user.id ? <Component {...pageProps} /> : <Loading />}
				</Main>
			</userContext.Provider>
			<ReactQueryDevtools />
		</NextUIProvider>
	);
});

MyApp.getInitialProps = async ({ ctx }) => {
	const cookies = getCookies(ctx);
	return {
		pageProps: {
			userIdCookie: cookies[USER_ID_COOKIE],
		},
	} as AppProps;
};

export default trpc.withTRPC(MyApp);
