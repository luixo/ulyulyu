import { COMMON, USERS } from "~/db/const";
import type { Database } from "~/db/index";

const removeLastActiveColumn = async (db: Database) => {
  await db.schema
    .alterTable(USERS.TABLE)
    .dropColumn("lastActiveTimestamp")
    .execute();
};

const addLastActiveColumn = async (db: Database) => {
  await db.schema
    .alterTable(USERS.TABLE)
    .addColumn("lastActiveTimestamp", "timestamp", (cb) =>
      cb.notNull().defaultTo(COMMON.nowTimestamp),
    )
    .execute();
};

export const up = async (db: Database) => {
  await removeLastActiveColumn(db);
};

export const down = async (db: Database) => {
  await addLastActiveColumn(db);
};
