import { TRPCError } from "@trpc/server";
import { parse } from "cookie";

import type { UserId } from "~/db/database.gen";
import { extendAuthCookie } from "~/server/auth";
import { middleware, procedure } from "~/server/trpc";
import { upsertUser } from "~/server/user";
import { userIdSchema } from "~/server/validation";
import { SESSION_ID_HEADER, USER_ID_COOKIE } from "~/utils/auth";

export const unauthProcedure = procedure.use(
  middleware(async ({ type, path, next, ctx }) => {
    const start = Date.now();
    const result = await next();
    const duration = Date.now() - start;
    const sourceType = ctx.req.headers.get("x-source");
    console.log(
      `${result.ok ? "OK" : "Non-OK"} request timing: [${sourceType}] ${type} "${path}" in ${duration}ms`,
    );
    return result;
  }),
);

export const authProcedure = unauthProcedure.use(
  middleware(async ({ ctx, next }) => {
    const cookies = parse(ctx.req.headers.get("cookie") ?? "");
    const userIdCookie = cookies[USER_ID_COOKIE] as UserId | undefined;
    if (!userIdCookie) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "No user id cookie provided",
      });
    }
    const uuidVerification = userIdSchema.safeParse(userIdCookie);
    if (!uuidVerification.success) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User id is not of valid type",
      });
    }
    const sessionId = ctx.req.headers.get(SESSION_ID_HEADER) || "unknown";
    const user = await upsertUser(
      userIdCookie,
      ctx.req.headers.get("user-agent") || "unknown",
    );
    extendAuthCookie(ctx.resHeaders, user.id);
    return next({
      ctx: {
        ...ctx,
        auth: {
          userId: user.id,
          sessionId,
        },
      },
    });
  }),
);

export type AuthContext = Parameters<
  Parameters<(typeof authProcedure)["query"]>[0]
>[0]["ctx"];
