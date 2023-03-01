import { customAlphabet } from "nanoid/non-secure";

import { getDatabase } from "@/db";
import { GAMES } from "@/db/contants";
import { authProcedure } from "@/server/procedures";

const nanoid = customAlphabet(GAMES.TYPES.ID_ALPHABET, GAMES.TYPES.ID_LENGTH);

export const procedure = authProcedure.mutation(async ({ ctx }) => {
	const db = getDatabase();
	const now = new Date();
	const game = await db
		.insertInto("games")
		.values({
			id: nanoid(),
			ownerId: ctx.auth.userId,
			state: { phase: "start" },
			createTimestamp: now,
		})
		.returning(["games.id", "games.createTimestamp"])
		.executeTakeFirst();
	return game!;
});
