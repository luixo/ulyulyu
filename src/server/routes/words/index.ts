import { router as baseRouter } from "~/server/trpc";

import { procedure as changeDefinition } from "./change-definition";
import { procedure as changeTerm } from "./change-term";
import { procedure as put } from "./put";
import { procedure as remove } from "./remove";

export const router = baseRouter({
  put,
  remove,
  changeTerm,
  changeDefinition,
});
