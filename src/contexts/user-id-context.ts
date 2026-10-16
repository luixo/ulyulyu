import React from "react";
import type { upsertUser } from "~/server/user";
import type { UserId } from "~/server/validation";
import { USER_ID_COOKIE } from "~/utils/auth";
import { YEAR } from "~/utils/time";

export const setUserLanguage = (userId: UserId) => {
	void window.cookieStore.delete({
		name: USER_ID_COOKIE,
		path: "/",
	});
	void window.cookieStore.set({
		expires: new Date(Date.now() + YEAR).valueOf(),
		name: USER_ID_COOKIE,
		path: "/",
		value: userId,
	});
};

type User = Awaited<ReturnType<typeof upsertUser>>;
export const UserContext = React.createContext<
	[User, React.Dispatch<React.SetStateAction<User>>]
>([
	{
		id: "unknown" as UserId,
		name: "unknown",
	},
	() => {
		/* empty */
	},
]);
