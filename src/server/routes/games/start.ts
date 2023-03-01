import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getDatabase } from "@/db";
import { authProcedure } from "@/server/procedures";
import { getPusher } from "@/server/pusher";
import { gameIdSchema, userIdSchema } from "@/server/validation";

export const procedure = authProcedure
	.input(z.object({ id: gameIdSchema, teamIds: userIdSchema.array() }))
	.mutation(async ({ ctx, input }) => {
		const db = getDatabase();
		const gameTeams = await db
			.selectFrom("games")
			.leftJoin("words", (qb) => qb.onRef("games.id", "=", "words.gameId"))
			.innerJoin("teams", (qb) => qb.onRef("games.id", "=", "teams.gameId"))
			.where("games.id", "=", input.id)
			.where("games.ownerId", "=", ctx.auth.userId)
			.select([
				"games.ownerId",
				"games.state",
				db.fn.min("words.position").as("firstWordPosition"),
				db.fn.count("words.id").as("wordsAmount"),
				"teams.userId",
			])
			.groupBy(["games.ownerId", "games.state", "teams.userId"])
			.execute();
		if (gameTeams.length === 0) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message:
					"Game not found or you are not the game owner or there are no teams in the game",
			});
		}
		const actualTeamIds = gameTeams.map((team) => team.userId).toSorted();
		const expectedTeamIds = input.teamIds.toSorted();
		if (
			actualTeamIds.length !== expectedTeamIds.length ||
			actualTeamIds.some(
				(actualId, index) => actualId !== expectedTeamIds[index],
			)
		) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "Team ids mismatch",
			});
		}
		if (gameTeams[0].wordsAmount === 0) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "Game cannot be started with no words",
			});
		}
		if (gameTeams[0].state.phase !== "start") {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "Game cannot be started in a current phase",
			});
		}

		await db
			.updateTable("games")
			.where("games.id", "=", input.id)
			.set({
				state: {
					phase: "proposal",
					currentPosition: gameTeams[0].firstWordPosition,
				},
			})
			.executeTakeFirst();
		const pusher = getPusher(ctx, input.id);
		pusher.trigger("game:start", { teamIds: input.teamIds });
	});
