import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "../db/schema";
export { sql, eq, and, or, desc, asc, inArray, count } from "drizzle-orm";

export const tables = schema;

export const db = drizzle("./sqlite.db");
