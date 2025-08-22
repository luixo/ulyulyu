import { getDatabase } from "~/db";
import { authProcedure } from "~/server/procedures";

export const procedure = authProcedure.query(async ({ ctx }) => {
  const db = getDatabase();
  const games = await db
    .selectFrom("games")
    .where("ownerId", "=", ctx.auth.userId)
    .select(["id", "state", "createdAt"])
    .execute();
  return games.map((game) => ({
    ...game,
    state:
      game.state.phase === "finish"
        ? ("done" as const)
        : game.state.phase === "start"
          ? ("start" as const)
          : ("in-progress" as const),
  }));
});
