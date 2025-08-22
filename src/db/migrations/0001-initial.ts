import { sql } from "kysely";

import {
  COMMON,
  DEFINITIONS,
  FUNCTIONS,
  GAMES,
  TEAMS,
  USERS,
  WORDS,
} from "~/db/const";
import type { Database } from "~/db/index";

const createUpdateFunction = async (db: Database) => {
  await sql`
	CREATE OR REPLACE FUNCTION ${sql.raw(FUNCTIONS.UPDATE_TIMESTAMP_COLUMN)} ()
		RETURNS TRIGGER
		AS $$
			BEGIN
				NEW.${sql.id(COMMON.updatedAtColumn)} = ${COMMON.nowTimestamp};
				RETURN NEW;
			END;
		$$
	LANGUAGE 'plpgsql';
	`.execute(db);
};

const removeUpdateFunction = async (db: Database) => {
  await sql`DROP FUNCTION ${sql.raw(FUNCTIONS.UPDATE_TIMESTAMP_COLUMN)}();`.execute(
    db,
  );
};

const createUserTable = async (db: Database) => {
  await db.schema
    .createTable(USERS.TABLE)
    .ifNotExists()
    .addColumn("id", "uuid", (cb) => cb.primaryKey().notNull())
    .addColumn("name", `varchar(${USERS.TYPES.NAME_LENGTH})`)
    .addColumn("lastActiveTimestamp", "timestamp", (cb) => cb.notNull())
    .addColumn(COMMON.createdAtColumn, "timestamp", (cb) =>
      cb.notNull().defaultTo(COMMON.nowTimestamp),
    )
    .addColumn(COMMON.updatedAtColumn, "timestamp", (cb) =>
      cb.notNull().defaultTo(COMMON.nowTimestamp),
    )
    .execute();
  await sql`
  CREATE TRIGGER ${sql.id(USERS.TRIGGERS.UPDATE_TIMESTAMP)}
    BEFORE UPDATE ON ${sql.table(USERS.TABLE)}
    FOR EACH ROW
    EXECUTE PROCEDURE ${sql.raw(FUNCTIONS.UPDATE_TIMESTAMP_COLUMN)} ();
  `.execute(db);
};

const removeUserTable = async (db: Database) => {
  await sql`
	DROP TRIGGER ${sql.id(USERS.TRIGGERS.UPDATE_TIMESTAMP)} ON ${sql.table(
    USERS.TABLE,
  )};`.execute(db);
  await db.schema.dropTable(USERS.TABLE).ifExists().execute();
};

const GAME_ID_TYPE = `varchar(${GAMES.TYPES.ID_LENGTH})` as const;

const createGamesTable = async (db: Database) => {
  await db.schema
    .createTable(GAMES.TABLE)
    .ifNotExists()
    .addColumn("id", GAME_ID_TYPE, (cb) => cb.primaryKey().notNull())
    .addColumn("ownerId", "uuid", (cb) =>
      cb
        .notNull()
        .references(`${USERS.TABLE}.id`)
        .onUpdate("cascade")
        .onDelete("cascade"),
    )
    .addColumn("state", "jsonb", (cb) => cb.notNull())
    .addColumn(COMMON.createdAtColumn, "timestamp", (cb) =>
      cb.notNull().defaultTo(COMMON.nowTimestamp),
    )
    .addColumn(COMMON.updatedAtColumn, "timestamp", (cb) =>
      cb.notNull().defaultTo(COMMON.nowTimestamp),
    )
    .execute();
  await db.schema
    .createIndex(GAMES.INDEXES.OWNER_ID)
    .on(GAMES.TABLE)
    .column("ownerId")
    .execute();
  await sql`
  CREATE TRIGGER ${sql.id(GAMES.TRIGGERS.UPDATE_TIMESTAMP)}
    BEFORE UPDATE ON ${sql.table(GAMES.TABLE)}
    FOR EACH ROW
    EXECUTE PROCEDURE ${sql.raw(FUNCTIONS.UPDATE_TIMESTAMP_COLUMN)} ();
  `.execute(db);
};

const removeGamesTable = async (db: Database) => {
  await sql`
	DROP TRIGGER ${sql.id(GAMES.TRIGGERS.UPDATE_TIMESTAMP)} ON ${sql.table(
    GAMES.TABLE,
  )};`.execute(db);
  await db.schema.dropIndex(GAMES.INDEXES.OWNER_ID).execute();
  await db.schema.dropTable(GAMES.TABLE).ifExists().execute();
};

const createTeamsTable = async (db: Database) => {
  await db.schema
    .createTable(TEAMS.TABLE)
    .ifNotExists()
    .addColumn("userId", "uuid", (cb) =>
      cb
        .notNull()
        .references(`${USERS.TABLE}.id`)
        .onUpdate("cascade")
        .onDelete("cascade"),
    )
    .addColumn("gameId", GAME_ID_TYPE, (cb) =>
      cb
        .notNull()
        .references(`${GAMES.TABLE}.id`)
        .onUpdate("cascade")
        .onDelete("cascade"),
    )
    .addColumn("nickname", `varchar(${TEAMS.TYPES.MAX_NAME_LENGTH})`, (cb) =>
      cb.notNull(),
    )
    .addColumn("ready", "boolean", (cb) => cb.notNull())
    .addColumn(COMMON.createdAtColumn, "timestamp", (cb) =>
      cb.notNull().defaultTo(COMMON.nowTimestamp),
    )
    .addColumn(COMMON.updatedAtColumn, "timestamp", (cb) =>
      cb.notNull().defaultTo(COMMON.nowTimestamp),
    )
    .addUniqueConstraint(TEAMS.CONSTRAINTS.USER_ID__GAME_ID, [
      "gameId",
      "userId",
    ])
    .execute();
  await db.schema
    .createIndex(TEAMS.INDEXES.GAME_ID)
    .on(TEAMS.TABLE)
    .column("gameId")
    .execute();
  await sql`
  CREATE TRIGGER ${sql.id(TEAMS.TRIGGERS.UPDATE_TIMESTAMP)}
    BEFORE UPDATE ON ${sql.table(TEAMS.TABLE)}
    FOR EACH ROW
    EXECUTE PROCEDURE ${sql.raw(FUNCTIONS.UPDATE_TIMESTAMP_COLUMN)} ();
  `.execute(db);
};

const removeTeamsTable = async (db: Database) => {
  await sql`
	DROP TRIGGER ${sql.id(TEAMS.TRIGGERS.UPDATE_TIMESTAMP)} ON ${sql.table(
    TEAMS.TABLE,
  )};`.execute(db);
  await db.schema.dropIndex(TEAMS.INDEXES.GAME_ID).execute();
  await db.schema.dropTable(TEAMS.TABLE).ifExists().execute();
};

const createWordsTable = async (db: Database) => {
  await db.schema
    .createTable(WORDS.TABLE)
    .ifNotExists()
    .addColumn("id", "uuid", (cb) => cb.primaryKey().notNull())
    .addColumn("gameId", GAME_ID_TYPE, (cb) =>
      cb
        .notNull()
        .references(`${GAMES.TABLE}.id`)
        .onUpdate("cascade")
        .onDelete("cascade"),
    )
    .addColumn("term", `varchar(${WORDS.TYPES.MAX_TERM_LENGTH})`, (cb) =>
      cb.notNull(),
    )
    .addColumn(
      "definition",
      `varchar(${DEFINITIONS.TYPES.MAX_DEFINITION_LENGTH})`,
      (cb) => cb.notNull(),
    )
    .addColumn("position", "int2", (cb) => cb.notNull())
    .addColumn("revealed", "boolean", (cb) => cb.notNull().defaultTo(true))
    .addColumn(COMMON.createdAtColumn, "timestamp", (cb) =>
      cb.notNull().defaultTo(COMMON.nowTimestamp),
    )
    .addColumn(COMMON.updatedAtColumn, "timestamp", (cb) =>
      cb.notNull().defaultTo(COMMON.nowTimestamp),
    )
    .addUniqueConstraint(WORDS.CONSTRAINTS.GAME_ID__POSITION, [
      "gameId",
      "position",
    ])
    .execute();
  await db.schema
    .createIndex(WORDS.INDEXES.GAME_ID)
    .on(WORDS.TABLE)
    .column("gameId")
    .execute();
  await sql`
  CREATE TRIGGER ${sql.id(WORDS.TRIGGERS.UPDATE_TIMESTAMP)}
    BEFORE UPDATE ON ${sql.table(WORDS.TABLE)}
    FOR EACH ROW
    EXECUTE PROCEDURE ${sql.raw(FUNCTIONS.UPDATE_TIMESTAMP_COLUMN)} ();
  `.execute(db);
};

const removeWordsTable = async (db: Database) => {
  await sql`
	DROP TRIGGER ${sql.id(WORDS.TRIGGERS.UPDATE_TIMESTAMP)} ON ${sql.table(
    WORDS.TABLE,
  )};`.execute(db);
  await db.schema.dropIndex(WORDS.INDEXES.GAME_ID).execute();
  await db.schema.dropTable(WORDS.TABLE).ifExists().execute();
};

const createDefinitionsTable = async (db: Database) => {
  await db.schema
    .createTable(DEFINITIONS.TABLE)
    .ifNotExists()
    .addColumn("wordId", "uuid", (cb) =>
      cb
        .notNull()
        .references(`${WORDS.TABLE}.id`)
        .onUpdate("cascade")
        .onDelete("cascade"),
    )
    .addColumn("userId", "uuid", (cb) =>
      cb
        .notNull()
        .references(`${USERS.TABLE}.id`)
        .onUpdate("cascade")
        .onDelete("cascade"),
    )
    .addColumn(
      "definition",
      `varchar(${DEFINITIONS.TYPES.MAX_DEFINITION_LENGTH})`,
    )
    .addColumn("guessUserId", "uuid", (cb) =>
      cb
        .references(`${USERS.TABLE}.id`)
        .onUpdate("cascade")
        .onDelete("cascade"),
    )
    .addColumn(COMMON.createdAtColumn, "timestamp", (cb) =>
      cb.notNull().defaultTo(COMMON.nowTimestamp),
    )
    .addColumn(COMMON.updatedAtColumn, "timestamp", (cb) =>
      cb.notNull().defaultTo(COMMON.nowTimestamp),
    )
    .addUniqueConstraint(DEFINITIONS.CONSTRAINTS.WORD_ID__USER_ID, [
      "wordId",
      "userId",
    ])
    .execute();
  await db.schema
    .createIndex(DEFINITIONS.INDEXES.WORD_ID)
    .on(DEFINITIONS.TABLE)
    .column("wordId")
    .execute();
  await sql`
  CREATE TRIGGER ${sql.id(DEFINITIONS.TRIGGERS.UPDATE_TIMESTAMP)}
    BEFORE UPDATE ON ${sql.table(DEFINITIONS.TABLE)}
    FOR EACH ROW
    EXECUTE PROCEDURE ${sql.raw(FUNCTIONS.UPDATE_TIMESTAMP_COLUMN)} ();
  `.execute(db);
};

const removeDefinitionsTable = async (db: Database) => {
  await sql`
  DROP TRIGGER ${sql.id(DEFINITIONS.TRIGGERS.UPDATE_TIMESTAMP)} ON ${sql.table(
    DEFINITIONS.TABLE,
  )};`.execute(db);
  await db.schema.dropIndex(DEFINITIONS.INDEXES.WORD_ID).execute();
  await db.schema.dropTable(DEFINITIONS.TABLE).ifExists().execute();
};

export const up = async (db: Database) => {
  await createUpdateFunction(db);

  await createUserTable(db);
  await createGamesTable(db);
  await createTeamsTable(db);
  await createWordsTable(db);
  await createDefinitionsTable(db);
};

export const down = async (db: Database) => {
  await removeDefinitionsTable(db);
  await removeWordsTable(db);
  await removeTeamsTable(db);
  await removeGamesTable(db);
  await removeUserTable(db);

  await removeUpdateFunction(db);
};
