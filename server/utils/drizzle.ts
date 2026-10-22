import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "../db/schema";

export { and, asc, count, desc, eq, inArray, like, or, sql } from "drizzle-orm";

const sqlite = new Database(process.env.DATABASE_PATH || "./sqlite.db");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("busy_timeout = 5000");

export const db = drizzle(sqlite, { schema });
export const tables = schema;

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
