import { Kysely, PostgresDialect, SelectExpression } from "kysely";
import { Pool } from "pg";

import { getDatabaseConfig } from "./config";
import { DatabaseTypes } from "./types";

export type DatabaseSelectExpression<TB extends keyof DatabaseTypes> =
	SelectExpression<DatabaseTypes, TB>;

const databaseConfig = getDatabaseConfig();
const dialect = new PostgresDialect({
	pool: new Pool(databaseConfig),
});
export type Database = Kysely<DatabaseTypes>;
export const getDatabase = () => new Kysely<DatabaseTypes>({ dialect });
