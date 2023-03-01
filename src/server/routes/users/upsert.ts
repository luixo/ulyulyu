import { z } from "zod";

import { getDatabase } from "@/db";
import { extendAuthCookie } from "@/server/auth";
import { unauthProcedure } from "@/server/procedures";
import { userIdSchema } from "@/server/validation";

export const procedure = unauthProcedure
	.input(z.object({ id: userIdSchema }))
	.query(async ({ input, ctx }) => {
		const db = getDatabase();
		const user = await db
			.selectFrom("users")
			.where("id", "=", input.id)
			.select(["id", "name"])
			.executeTakeFirst();
		if (!user) {
			const newUser = await db
				.insertInto("users")
				.values({
					id: input.id,
					lastActiveTimestamp: new Date(),
				})
				.returning(["users.id", "users.name"])
				.executeTakeFirstOrThrow();
			extendAuthCookie(ctx.res, input.id);
			return newUser;
		}
		return user;
	});
