import { TRPCError } from "@trpc/server";
import { setAuthCookie } from "~/server/auth";
import { middleware, procedure } from "~/server/trpc";
import { upsertUser } from "~/server/user";
import type { UserId } from "~/server/validation";
import { userIdSchema } from "~/server/validation";
import { SESSION_ID_HEADER, USER_ID_COOKIE } from "~/utils/auth";
import { getCookies } from "~/utils/cookie";

const unauthProcedure = procedure.use(
	middleware(async ({ type, path, next, ctx }) => {
		const start = Date.now();
		// This is a false positive
		// oxlint-disable-next-line node/callback-return
		const result = await next();
		const duration = Date.now() - start;
		const sourceType = ctx.req.headers.get("x-source");
		// oxlint-disable-next-line no-console
		console.log(
			`${result.ok ? "OK" : "Non-OK"} request timing: [${sourceType}] ${type} "${path}" in ${duration}ms`,
		);
		return result;
	}),
);

export const authProcedure = unauthProcedure.use(
	middleware(async ({ ctx, next }) => {
		const cookies = await getCookies();
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
		const sessionId = ctx.req.headers.get(SESSION_ID_HEADER) ?? "unknown";
		const user = await upsertUser(
			userIdCookie,
			ctx.req.headers.get("user-agent") ?? "unknown",
		);
		setAuthCookie(user.id);
		return next({
			ctx: {
				...ctx,
				auth: {
					sessionId,
					userId: user.id,
				},
			},
		});
	}),
);

export type AuthContext = Parameters<
	Parameters<(typeof authProcedure)["query"]>[0]
>[0]["ctx"];
