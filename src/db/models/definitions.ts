// @generated
// Automatically generated. Don't change this file manually.

import type { UsersId } from "./users";
import type { WordsId } from "./words";

export default interface Definitions {
	/**
	 * Index: definitions:[wordId:userId]
	 * Index: definitions:wordId:index
	 */
	wordId: WordsId;

	/** Index: definitions:[wordId:userId] */
	userId: UsersId;

	definition: string | null;

	guessUserId: UsersId | null;
}

export interface DefinitionsInitializer {
	/**
	 * Index: definitions:[wordId:userId]
	 * Index: definitions:wordId:index
	 */
	wordId: WordsId;

	/** Index: definitions:[wordId:userId] */
	userId: UsersId;

	definition?: string | null;

	guessUserId?: UsersId | null;
}

export interface DefinitionsMutator {
	/**
	 * Index: definitions:[wordId:userId]
	 * Index: definitions:wordId:index
	 */
	wordId?: WordsId;

	/** Index: definitions:[wordId:userId] */
	userId?: UsersId;

	definition?: string | null;

	guessUserId?: UsersId | null;
}
