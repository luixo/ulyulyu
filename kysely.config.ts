import { defineConfig } from "kysely-ctl";

import { getDatabase } from "./src/db/index";

export default defineConfig({
  kysely: getDatabase(),
  migrations: {
    migrationFolder: "src/db/migrations",
  },
});
