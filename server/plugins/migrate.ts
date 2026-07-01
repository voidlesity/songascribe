import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

export default defineNitroPlugin(() => {
  const db = drizzle("./sqlite.db");
  migrate(db, { migrationsFolder: "./server/db/migrations" });
});
