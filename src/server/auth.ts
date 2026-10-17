import { createIsomorphicFn } from "@tanstack/react-start";
import { setCookie } from "@tanstack/react-start/server";
import type { UserId } from "~/server/validation";
import { USER_ID_COOKIE } from "~/utils/auth";
import { YEAR } from "~/utils/time";

export const setAuthCookie = createIsomorphicFn().server((userId: UserId) => {
	setCookie(USER_ID_COOKIE, userId, {
		expires: new Date(Date.now() + YEAR),
		path: "/",
		secure: true,
	});
});
