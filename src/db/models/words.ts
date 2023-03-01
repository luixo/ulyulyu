// @generated
// Automatically generated. Don't change this file manually.

import type { GamesId } from "./games";

/** Identifier type for "words" table */
export type WordsId = string & { __flavor?: "words" };

export default interface Words {
	/** Primary key. Index: words_pkey */
	id: WordsId;

	/**
	 * Index: words:[wordId:position]
	 * Index: words:gameId:index
	 */
	gameId: GamesId;

	term: string;

	definition: string;

	/** Index: words:[wordId:position] */
	position: number;

	revealed: boolean;
}

export interface WordsInitializer {
	/** Primary key. Index: words_pkey */
	id: WordsId;

	/**
	 * Index: words:[wordId:position]
	 * Index: words:gameId:index
	 */
	gameId: GamesId;

	term: string;

	definition: string;

	/** Index: words:[wordId:position] */
	position: number;

	/** Default value: true */
	revealed?: boolean;
}

export interface WordsMutator {
	/** Primary key. Index: words_pkey */
	id?: WordsId;

	/**
	 * Index: words:[wordId:position]
	 * Index: words:gameId:index
	 */
	gameId?: GamesId;

	term?: string;

	definition?: string;

	/** Index: words:[wordId:position] */
	position?: number;

	revealed?: boolean;
}
