// @generated
// Automatically generated. Don't change this file manually.

import type { UsersId } from "./users";

/** Identifier type for "games" table */
export type GamesId = string & { __flavor?: "games" };

export default interface Games {
	/** Primary key. Index: games_pkey */
	id: GamesId;

	/** Index: games:ownerId:index */
	ownerId: UsersId;

	state:
		| { phase: "start" }
		| { phase: "proposal"; currentPosition: number }
		| { phase: "guessing"; currentPosition: number }
		| { phase: "finish" };

	createTimestamp: Date;
}

export interface GamesInitializer {
	/** Primary key. Index: games_pkey */
	id: GamesId;

	/** Index: games:ownerId:index */
	ownerId: UsersId;

	state:
		| { phase: "start" }
		| { phase: "proposal"; currentPosition: number }
		| { phase: "guessing"; currentPosition: number }
		| { phase: "finish" };

	createTimestamp: Date;
}

export interface GamesMutator {
	/** Primary key. Index: games_pkey */
	id?: GamesId;

	/** Index: games:ownerId:index */
	ownerId?: UsersId;

	state?:
		| { phase: "start" }
		| { phase: "proposal"; currentPosition: number }
		| { phase: "guessing"; currentPosition: number }
		| { phase: "finish" };

	createTimestamp?: Date;
}
