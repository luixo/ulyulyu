import { initTRPC } from "@trpc/server";

import { UnauthorizedContext } from "@/server/context";

export const { router, procedure, middleware } = initTRPC
	.context<UnauthorizedContext>()
	.create();
