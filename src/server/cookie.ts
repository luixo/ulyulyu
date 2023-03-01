import * as cookie from "cookie";
import { NextApiResponse } from "next";

export const setCookie = (
	res: NextApiResponse,
	cookieName: string,
	cookieValue: string,
	opts?: cookie.CookieSerializeOptions,
) => {
	const setCookieHeader = res.getHeader("set-cookie") || "";
	res.setHeader(
		"set-cookie",
		setCookieHeader + cookie.serialize(cookieName, cookieValue, opts),
	);
};
