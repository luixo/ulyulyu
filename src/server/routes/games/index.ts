import { router as baseRouter } from "@/server/trpc";

import { procedure as changeState } from "./change-state";
import { procedure as changeStateCurrentPosition } from "./change-state-current-position";
import { procedure as get } from "./get";
import { procedure as getAll } from "./get-all";
import { procedure as put } from "./put";
import { procedure as start } from "./start";

export const router = baseRouter({
	get,
	getAll,
	put,
	start,
	changeState,
	changeStateCurrentPosition,
});
