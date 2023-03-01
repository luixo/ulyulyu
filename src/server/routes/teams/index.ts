import { router as baseRouter } from "@/server/trpc";

import { procedure as changeNickname } from "./change-nickname";
import { procedure as changeReadiness } from "./change-readiness";
import { procedure as join } from "./join";
import { procedure as kick } from "./kick";
import { procedure as leave } from "./leave";

export const router = baseRouter({
	join,
	leave,
	kick,
	changeReadiness,
	changeNickname,
});
