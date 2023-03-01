import { NextApiResponse } from "next";

import { UsersId } from "@/db/models";
import { USER_ID_COOKIE } from "@/lib/cookie";
import { YEAR } from "@/lib/time";
import { setCookie } from "@/server/cookie";

export const extendAuthCookie = (res: NextApiResponse, id: UsersId) => {
	const expirationDate = new Date(Date.now() + YEAR);
	setCookie(res, USER_ID_COOKIE, id, { expires: expirationDate, path: "/" });
};
