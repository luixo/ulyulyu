import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { PoolConfig } from "pg";
import type { DB } from "~/db/database.gen";

const getDatabaseConfig = (): PoolConfig => {
	const { DATABASE_URL = "" } = process.env;
	if (!DATABASE_URL) {
		throw new Error("Expected to have process.env.DATABASE_URL variable!");
	}
	return {
		connectionString: DATABASE_URL,
		ssl: true,
	};
};

const databaseConfig = getDatabaseConfig();
const dialect = new PostgresDialect({
	pool: new Pool(databaseConfig),
});
export type Database = Kysely<DB>;
export const getDatabase = () => new Kysely<DB>({ dialect });
