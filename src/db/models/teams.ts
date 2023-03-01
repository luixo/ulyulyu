// @generated
// Automatically generated. Don't change this file manually.

import type { GamesId } from "./games";
import type { UsersId } from "./users";

export default interface Teams {
	/** Index: teams:[userId:gameId] */
	userId: UsersId;

	/**
	 * Index: teams:[userId:gameId]
	 * Index: teams:gameId:index
	 */
	gameId: GamesId;

	nickname: string;

	ready: boolean;
}

export interface TeamsInitializer {
	/** Index: teams:[userId:gameId] */
	userId: UsersId;

	/**
	 * Index: teams:[userId:gameId]
	 * Index: teams:gameId:index
	 */
	gameId: GamesId;

	nickname: string;

	ready: boolean;
}

export interface TeamsMutator {
	/** Index: teams:[userId:gameId] */
	userId?: UsersId;

	/**
	 * Index: teams:[userId:gameId]
	 * Index: teams:gameId:index
	 */
	gameId?: GamesId;

	nickname?: string;

	ready?: boolean;
}
