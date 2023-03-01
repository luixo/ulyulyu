import { z } from "zod";

import { DEFINITIONS, GAMES, TEAMS, WORDS } from "@/db/contants";
import { GamesId, UsersId, WordsId } from "@/db/models";

const flavored = <T extends string>(x: string): x is T => true;

export const userIdSchema = z.string().uuid().refine<UsersId>(flavored);
export const wordIdSchema = z.string().uuid().refine<WordsId>(flavored);

export const gameIdSchema = z
	.string()
	.length(GAMES.TYPES.ID_LENGTH)
	.regex(new RegExp(`^[${GAMES.TYPES.ID_ALPHABET}]{12}$`))
	.refine<GamesId>(flavored);
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
