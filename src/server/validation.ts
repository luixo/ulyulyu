import { z } from "zod";

import { DEFINITIONS, GAMES, TEAMS, WORDS } from "~/db/const";

const inputOutputBrand = <T extends z.core.$ZodType, B extends string>(
  input: T,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _brand: B,
) =>
  input as z.core.$ZodBranded<T, B> &
    Record<"_zod", Record<"input", z.input<T> & z.$brand<B>>>;

export const userIdSchema = inputOutputBrand(z.uuid(), "UserId");
export type UserId = z.infer<typeof userIdSchema>;
export const wordIdSchema = inputOutputBrand(z.uuid(), "WordId");
export type WordId = z.infer<typeof wordIdSchema>;
export const gameIdSchema = inputOutputBrand(
  z
    .string()
    .length(GAMES.TYPES.ID_LENGTH)
    .regex(new RegExp(`^[${GAMES.TYPES.ID_ALPHABET}]{12}$`)),
  "GameId",
);
export type GameId = z.infer<typeof gameIdSchema>;

export const teamNicknameSchema = z
  .string()
  .min(TEAMS.TYPES.MIN_NAME_LENGTH)
  .max(TEAMS.TYPES.MAX_NAME_LENGTH);
export const termSchema = z
  .string()
  .min(WORDS.TYPES.MIN_TERM_LENGTH)
  .max(WORDS.TYPES.MAX_TERM_LENGTH);
export const definitionSchema = z
  .string()
  .min(DEFINITIONS.TYPES.MIN_DEFINITION_LENGTH)
  .max(DEFINITIONS.TYPES.MAX_DEFINITION_LENGTH);
export const guessUserIdSchema = z.string();
