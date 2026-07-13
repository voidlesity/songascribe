import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import { getDatabase } from "../utils/drizzle";

export default defineNitroPlugin(() => {
  migrate(getDatabase(), { migrationsFolder: "./server/db/migrations" });
});
