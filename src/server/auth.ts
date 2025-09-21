import { serialize } from "cookie";

import type { UserId } from "~/server/validation";
import { USER_ID_COOKIE } from "~/utils/auth";
import { YEAR } from "~/utils/time";

export const getAuthCookie = (id: UserId) => `${USER_ID_COOKIE}=${id}`;

export const getSetAuthCookie = (id: UserId) => {
  const expirationDate = new Date(Date.now() + YEAR);
  return serialize(USER_ID_COOKIE, id, { expires: expirationDate, path: "/" });
};

export const extendAuthCookie = (headers: Headers, id: UserId) => {
  const setCookieHeader = headers.get("set-cookie") || "";
  headers.set("set-cookie", setCookieHeader + getSetAuthCookie(id));
};
