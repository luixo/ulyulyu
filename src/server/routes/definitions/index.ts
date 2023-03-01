import { router as baseRouter } from "@/server/trpc";

import { procedure as getAdmin } from "./get-admin";
import { procedure as getAdminGuessing } from "./get-admin-guessing";
import { procedure as getPlayer } from "./get-player";
import { procedure as getPlayerGuessing } from "./get-player-guessing";
import { procedure as put } from "./put";
import { procedure as reveal } from "./reveal";
import { procedure as vote } from "./vote";

export const router = baseRouter({
	getAdmin,
	getPlayer,
	put,
	vote,
	getAdminGuessing,
	getPlayerGuessing,
	reveal,
});
