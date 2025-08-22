import { TRPCError } from "@trpc/server";
import { parse } from "cookie";
import { v4 } from "uuid";

import { getDatabase } from "~/db";
import type { UserId } from "~/db/database.gen";
import { extendAuthCookie } from "~/server/auth";
import { middleware, procedure } from "~/server/trpc";
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
    const database = getDatabase();
    const user = await database
      .selectFrom("users")
      .where("users.id", "=", userIdCookie)
      .select("users.id")
      .executeTakeFirst();
    let userId = user?.id;
    if (!userId) {
      userId = v4() as UserId;
      await database
        .insertInto("users")
        .values({
          id: userId,
          lastActiveTimestamp: new Date(),
        })
        .returning(["users.id", "users.name"])
        .executeTakeFirst();
    } else {
      void database
        .updateTable("users")
        .where("users.id", "=", userId)
        .set({ lastActiveTimestamp: new Date() })
        .executeTakeFirst();
    }
    extendAuthCookie(ctx.resHeaders, userId);
    return next({
      ctx: {
        ...ctx,
        auth: {
          userId: userId as UserId,
          sessionId,
        },
      },
    });
  }),
);

export type AuthContext = Parameters<
  Parameters<(typeof authProcedure)["query"]>[0]
>[0]["ctx"];
