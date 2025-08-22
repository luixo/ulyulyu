import { sql } from "kysely";

import { COMMON, DEFINITIONS, GAMES, TEAMS, USERS, WORDS } from "~/db/const";
import type { Database } from "~/db/index";

const toTsTz = (columnName: string) =>
  sql`timestamptz using ${sql.id(columnName)} at time zone 'UTC'`;
const toTs = (columnName: string) => sql`timestamp using ${sql.id(columnName)}`;

const upgradeGamesColumns = async (db: Database) => {
  await db.schema
    .alterTable(GAMES.TABLE)
    .alterColumn(COMMON.createdAtColumn, (col) =>
      col.setDataType(toTsTz(COMMON.createdAtColumn)),
    )
    .alterColumn(COMMON.updatedAtColumn, (col) =>
      col.setDataType(toTsTz(COMMON.updatedAtColumn)),
    )
    .execute();
};

const downgradeGamesColumns = async (db: Database) => {
  await db.schema
    .alterTable(GAMES.TABLE)

    .alterColumn(COMMON.createdAtColumn, (col) =>
      col.setDataType(toTs(COMMON.createdAtColumn)),
    )
    .alterColumn(COMMON.updatedAtColumn, (col) =>
      col.setDataType(toTs(COMMON.updatedAtColumn)),
    )
    .execute();
};

const upgradeUsersColumns = async (db: Database) => {
  await db.schema
    .alterTable(USERS.TABLE)
    .alterColumn(COMMON.createdAtColumn, (col) =>
      col.setDataType(toTsTz(COMMON.createdAtColumn)),
    )
    .alterColumn(COMMON.updatedAtColumn, (col) =>
      col.setDataType(toTsTz(COMMON.updatedAtColumn)),
    )
    .execute();
};

const downgradeUsersColumns = async (db: Database) => {
  await db.schema
    .alterTable(USERS.TABLE)

    .alterColumn(COMMON.createdAtColumn, (col) =>
      col.setDataType(toTs(COMMON.createdAtColumn)),
    )
    .alterColumn(COMMON.updatedAtColumn, (col) =>
      col.setDataType(toTs(COMMON.updatedAtColumn)),
    )
    .execute();
};

const upgradeTeamsColumns = async (db: Database) => {
  await db.schema
    .alterTable(TEAMS.TABLE)
    .alterColumn(COMMON.createdAtColumn, (col) =>
      col.setDataType(toTsTz(COMMON.createdAtColumn)),
    )
    .alterColumn(COMMON.updatedAtColumn, (col) =>
      col.setDataType(toTsTz(COMMON.updatedAtColumn)),
    )
    .execute();
};

const downgradeTeamsColumns = async (db: Database) => {
  await db.schema
    .alterTable(TEAMS.TABLE)

    .alterColumn(COMMON.createdAtColumn, (col) =>
      col.setDataType(toTs(COMMON.createdAtColumn)),
    )
    .alterColumn(COMMON.updatedAtColumn, (col) =>
      col.setDataType(toTs(COMMON.updatedAtColumn)),
    )
    .execute();
};

const downgradeWordsColumns = async (db: Database) => {
  await db.schema
    .alterTable(WORDS.TABLE)

    .alterColumn(COMMON.createdAtColumn, (col) =>
      col.setDataType(toTs(COMMON.createdAtColumn)),
    )
    .alterColumn(COMMON.updatedAtColumn, (col) =>
      col.setDataType(toTs(COMMON.updatedAtColumn)),
    )
    .execute();
};

const upgradeWordsColumns = async (db: Database) => {
  await db.schema
    .alterTable(WORDS.TABLE)
    .alterColumn(COMMON.createdAtColumn, (col) =>
      col.setDataType(toTsTz(COMMON.createdAtColumn)),
    )
    .alterColumn(COMMON.updatedAtColumn, (col) =>
      col.setDataType(toTsTz(COMMON.updatedAtColumn)),
    )
    .execute();
};

const upgradeDefinitionsColumns = async (db: Database) => {
  await db.schema
    .alterTable(DEFINITIONS.TABLE)
    .alterColumn(COMMON.createdAtColumn, (col) =>
      col.setDataType(toTsTz(COMMON.createdAtColumn)),
    )
    .alterColumn(COMMON.updatedAtColumn, (col) =>
      col.setDataType(toTsTz(COMMON.updatedAtColumn)),
    )
    .execute();
};

const downgradeDefinitionsColumns = async (db: Database) => {
  await db.schema
    .alterTable(DEFINITIONS.TABLE)

    .alterColumn(COMMON.createdAtColumn, (col) =>
      col.setDataType(toTs(COMMON.createdAtColumn)),
    )
    .alterColumn(COMMON.updatedAtColumn, (col) =>
      col.setDataType(toTs(COMMON.updatedAtColumn)),
    )
    .execute();
};

export const up = async (db: Database) => {
  await upgradeGamesColumns(db);
  await upgradeUsersColumns(db);
  await upgradeTeamsColumns(db);
  await upgradeWordsColumns(db);
  await upgradeDefinitionsColumns(db);
};

export const down = async (db: Database) => {
  await downgradeGamesColumns(db);
  await downgradeUsersColumns(db);
  await downgradeTeamsColumns(db);
  await downgradeWordsColumns(db);
  await downgradeDefinitionsColumns(db);
};
