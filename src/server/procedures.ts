import { TRPCError, ProcedureBuilder } from "@trpc/server";
import { v4 } from "uuid";

import { getDatabase } from "@/db";
import { UsersId } from "@/db/models";
import { SESSION_ID_HEADER, USER_ID_COOKIE } from "@/lib/cookie";
import { extendAuthCookie } from "@/server/auth";
import { procedure, middleware } from "@/server/trpc";
import { userIdSchema } from "@/server/validation";

export const unauthProcedure = procedure.use(
	middleware(async ({ type, path, next }) => {
		const start = Date.now();
		const result = await next();
		const duration = Date.now() - start;
		const options = {
			path,
			type,
			durationMs: duration,
		};
		/* eslint-disable no-console */
		if (result.ok) {
			console.log("OK request timing:", options);
		} else {
			console.log("Non-OK request timing", options);
		}
		/* eslint-enable no-console */
		return result;
	}),
);

export const authProcedure = unauthProcedure.use(
	middleware(async ({ ctx, next }) => {
		const userIdCookie = ctx.req.cookies[USER_ID_COOKIE];
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
		const sessionId = ctx.req.headers[SESSION_ID_HEADER] as string;
		const database = getDatabase();
		const user = await database
			.selectFrom("users")
			.where("users.id", "=", userIdCookie)
			.select("users.id")
			.executeTakeFirst();
		let userId = user?.id;
		if (!userId) {
			userId = v4();
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
		extendAuthCookie(ctx.res, userId);
		return next({
			ctx: {
				...ctx,
				auth: {
					userId: userIdCookie as UsersId,
					sessionId: sessionId || "unknown",
				},
			},
		});
	}),
);

type ProcedureParams<P extends ProcedureBuilder<any>> =
	P extends ProcedureBuilder<infer X> ? X : never;
type ProcedureContext<P extends ProcedureBuilder<any>> =
	ProcedureParams<P>["_ctx_out"];
export type AuthContext = ProcedureContext<typeof authProcedure>;
