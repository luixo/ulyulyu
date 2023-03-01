import { v4 } from "uuid";

import { getDatabase } from "@/db";
import { unauthProcedure } from "@/server/procedures";

export const procedure = unauthProcedure.mutation(async () => {
	const db = getDatabase();
	const user = await db
		.insertInto("users")
		.values({
			id: v4(),
			lastActiveTimestamp: new Date(),
		})
		.returning(["users.id"])
		.executeTakeFirst();
	return { userId: user!.id };
});
