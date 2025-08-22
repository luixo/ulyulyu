import { Kysely, PostgresDialect } from "kysely";
import { Pool, type PoolConfig } from "pg";

import type { DB } from "~/db/database.gen";

const getDatabaseConfig = (): PoolConfig => {
  if (!process.env.DATABASE_URL) {
    throw new Error("Expected to have process.env.DATABASE_URL variable!");
  }
  return {
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  };
};

const databaseConfig = getDatabaseConfig();
const dialect = new PostgresDialect({
  pool: new Pool(databaseConfig),
});
export type Database = Kysely<DB>;
export const getDatabase = () => new Kysely<DB>({ dialect });
