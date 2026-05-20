import { drizzle } from "drizzle-orm/better-sqlite3";
export { sql, eq, and, or, desc, asc, inArray, count } from "drizzle-orm";

import * as schema from "../db/schema";

export const tables = schema;

export const db = drizzle("./sqlite.db");
