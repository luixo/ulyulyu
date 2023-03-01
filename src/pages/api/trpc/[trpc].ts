import { createNextApiHandler } from "@trpc/server/adapters/next";

import { createContext } from "@/server/context";
import { appRouter } from "@/server/router";

export default createNextApiHandler({
	router: appRouter,
	createContext,
});

// @see https://nextjs.org/docs/api-routes/request-helpers#custom-config
export const config = {
	api: {
		externalResolver: true,
	},
};
