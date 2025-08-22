import { USERS } from "~/db/const";
import type { Database } from "~/db/index";

const addUserAgentField = async (db: Database) => {
  await db.schema
    .alterTable(USERS.TABLE)
    .addColumn("userAgent", "varchar(1024)", (cb) =>
      cb.notNull().defaultTo("unknown"),
    )
    .execute();
};

const removeUserAgentField = async (db: Database) => {
  await db.schema.alterTable(USERS.TABLE).dropColumn("userAgent").execute();
};

export const up = async (db: Database) => {
  await addUserAgentField(db);
};

export const down = async (db: Database) => {
  await removeUserAgentField(db);
};
