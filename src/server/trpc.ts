import { initTRPC } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

import { transformer } from "~/utils/transformer";

export const { router, procedure, middleware } = initTRPC
  .context<FetchCreateContextFnOptions>()
  .create({ transformer });
