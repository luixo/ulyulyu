import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getDatabase } from "~/db";
import type { Games } from "~/db/database.gen";
import { getEmitter } from "~/server/emitter";
import { authProcedure } from "~/server/procedures";
import { gameIdSchema } from "~/server/validation";

export const procedure = authProcedure
  .input(
    z.object({
      id: gameIdSchema,
      direction: z.union([z.literal("forward"), z.literal("backward")]),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const db = getDatabase();
    const game = await db
      .selectFrom("games")
      .leftJoin("words", (qb) => qb.onRef("games.id", "=", "words.gameId"))
      .leftJoin("teams", (qb) => qb.onRef("games.id", "=", "teams.gameId"))
      .where("games.id", "=", input.id)
      .where("games.ownerId", "=", ctx.auth.userId)
      .select([
        "games.ownerId",
        "games.state",
        db.fn.max("words.position").as("lastWordPosition"),
        db.fn.min("words.position").as("firstWordPosition"),
        db.fn.count("words.id").as("wordsAmount"),
        db.fn.count("teams.userId").as("teamsAmount"),
      ])
      .groupBy(["games.ownerId", "games.state"])
      .executeTakeFirst();
    if (!game) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Game not found or you are not the game owner",
      });
    }
    let nextState: Games["state"];
    switch (input.direction) {
      case "forward": {
        switch (game.state.phase) {
          case "start":
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Game should be started via game.start handler",
            });
          case "proposal":
            nextState = {
              phase: "guessing",
              currentPosition: game.firstWordPosition,
            };
            break;
          case "guessing":
            nextState = { phase: "finish" };
            break;
          case "finish":
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: "Game cannot be forwarded from 'finish' state",
            });
        }
        break;
      }
      case "backward": {
        switch (game.state.phase) {
          case "start":
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: "Game cannot be backwarded from 'start' state",
            });
          case "proposal":
            nextState = { phase: "start" };
            break;
          case "guessing":
            nextState = {
              phase: "proposal",
              currentPosition: game.lastWordPosition,
            };
            break;
          case "finish":
            nextState = {
              phase: "guessing",
              currentPosition: game.lastWordPosition,
            };
            break;
        }
        break;
      }
    }
    await db
      .updateTable("games")
      .where("games.id", "=", input.id)
      .set({ state: nextState })
      .executeTakeFirst();
    const emitter = getEmitter(ctx, input.id);
    emitter.trigger("game:state", { state: nextState });
  });
