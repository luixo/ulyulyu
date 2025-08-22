import { router as definitions } from "~/server/routes/definitions";
import { router as games } from "~/server/routes/games";
import { router as teams } from "~/server/routes/teams";
import { router as users } from "~/server/routes/users";
import { router as words } from "~/server/routes/words";
import { router as baseRouter } from "~/server/trpc";

export const appRouter = baseRouter({
  games,
  users,
  teams,
  words,
  definitions,
});

export type AppRouter = typeof appRouter;
