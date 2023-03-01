export const GAMES = {
	TABLE: "games",
	TYPES: {
		ID_LENGTH: 12,
		ID_ALPHABET: "1234567890abcdef",
	},
	INDEXES: {
		OWNER_ID: "games:ownerId:index",
	},
} as const;

export const USERS = {
	TABLE: "users",
	TYPES: {
		NAME_LENGTH: 255,
	},
} as const;

export const TEAMS = {
	TABLE: "teams",
	TYPES: {
		MIN_NAME_LENGTH: 2,
		MAX_NAME_LENGTH: 255,
	},
	INDEXES: {
		GAME_ID: "teams:gameId:index",
	},
	CONSTRAINTS: {
		USER_ID__GAME_ID: "teams:[userId:gameId]",
	},
} as const;

export const WORDS = {
	TABLE: "words",
	TYPES: {
		MIN_TERM_LENGTH: 2,
		MAX_TERM_LENGTH: 255,
	},
	INDEXES: {
		GAME_ID: "words:gameId:index",
	},
	CONSTRAINTS: {
		GAME_ID__POSITION: "words:[wordId:position]",
	},
} as const;

export const DEFINITIONS = {
	TABLE: "definitions",
	TYPES: {
		MIN_DEFINITION_LENGTH: 2,
		MAX_DEFINITION_LENGTH: 255,
	},
	INDEXES: {
		WORD_ID: "definitions:wordId:index",
	},
	CONSTRAINTS: {
		WORD_ID__USER_ID: "definitions:[wordId:userId]",
	},
} as const;
