import { migrate } from "drizzle-orm/better-sqlite3/migrator";

export default defineNitroPlugin(() => {
  migrate(db, { migrationsFolder: "./server/db/migrations" });
});
