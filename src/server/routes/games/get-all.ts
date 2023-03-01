import { getDatabase } from "@/db";
import { authProcedure } from "@/server/procedures";

export const procedure = authProcedure.query(async ({ ctx }) => {
	const db = getDatabase();
	const games = await db
		.selectFrom("games")
		.where("ownerId", "=", ctx.auth.userId)
		.select(["id", "state", "createTimestamp"])
		.execute();
	return games;
});
