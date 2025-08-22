import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getDatabase } from "~/db";
import { getEmitter } from "~/server/emitter";
import { authProcedure } from "~/server/procedures";
import { gameIdSchema, userIdSchema } from "~/server/validation";

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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const firstTeam = gameTeams[0]!;
    if (firstTeam.wordsAmount === 0) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Game cannot be started with no words",
      });
    }
    if (firstTeam.state.phase !== "start") {
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
          currentPosition: firstTeam.firstWordPosition,
        },
      })
      .executeTakeFirst();
    const emitter = getEmitter(ctx, input.id);
    emitter.trigger("game:start", { teamIds: input.teamIds });
  });
