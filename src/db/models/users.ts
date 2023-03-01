// @generated
// Automatically generated. Don't change this file manually.

/** Identifier type for "users" table */
export type UsersId = string & { __flavor?: "users" };

export default interface Users {
	/** Primary key. Index: users_pkey */
	id: UsersId;

	name: string | null;

	lastActiveTimestamp: Date;
}

export interface UsersInitializer {
	/** Primary key. Index: users_pkey */
	id: UsersId;

	name?: string | null;

	lastActiveTimestamp: Date;
}

export interface UsersMutator {
	/** Primary key. Index: users_pkey */
	id?: UsersId;

	name?: string | null;

	lastActiveTimestamp?: Date;
}
