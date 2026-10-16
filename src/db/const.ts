import { sql } from "kysely";

export const COMMON = {
	createdAtColumn: "createdAt",
	nowTimestamp: sql`CURRENT_TIMESTAMP`,
	updatedAtColumn: "updatedAt",
};

export const GAMES = {
	INDEXES: {
		OWNER_ID: "games:ownerId:index",
	},
	TABLE: "games",
	TRIGGERS: {
		UPDATE_TIMESTAMP: "games:updateTimestamp",
	},
	TYPES: {
		ID_ALPHABET: "1234567890abcdef",
		ID_LENGTH: 12,
	},
} as const;

export const USERS = {
	TABLE: "users",
	TRIGGERS: {
		UPDATE_TIMESTAMP: "users:updateTimestamp",
	},
	TYPES: {
		NAME_LENGTH: 255,
	},
} as const;

export const TEAMS = {
	CONSTRAINTS: {
		USER_ID__GAME_ID: "teams:[userId:gameId]",
	},
	INDEXES: {
		GAME_ID: "teams:gameId:index",
	},
	TABLE: "teams",
	TRIGGERS: {
		UPDATE_TIMESTAMP: "teams:updateTimestamp",
	},
	TYPES: {
		MAX_NAME_LENGTH: 255,
		MIN_NAME_LENGTH: 2,
	},
} as const;

export const WORDS = {
	CONSTRAINTS: {
		GAME_ID__POSITION: "words:[wordId:position]",
	},
	INDEXES: {
		GAME_ID: "words:gameId:index",
	},
	TABLE: "words",
	TRIGGERS: {
		UPDATE_TIMESTAMP: "words:updateTimestamp",
	},
	TYPES: {
		MAX_TERM_LENGTH: 255,
		MIN_TERM_LENGTH: 2,
	},
} as const;

export const DEFINITIONS = {
	CONSTRAINTS: {
		WORD_ID__USER_ID: "definitions:[wordId:userId]",
	},
	INDEXES: {
		WORD_ID: "definitions:wordId:index",
	},
	TABLE: "definitions",
	TRIGGERS: {
		UPDATE_TIMESTAMP: "definitions:updateTimestamp",
	},
	TYPES: {
		MAX_DEFINITION_LENGTH: 255,
		MIN_DEFINITION_LENGTH: 2,
	},
} as const;

export const FUNCTIONS = {
	UPDATE_TIMESTAMP_COLUMN: "updateTimestampColumn",
} as const;
