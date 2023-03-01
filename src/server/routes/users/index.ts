import { router as baseRouter } from "@/server/trpc";

import { procedure as put } from "./put";
import { procedure as upsert } from "./upsert";

export const router = baseRouter({
	put,
	upsert,
});
