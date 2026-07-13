import { createRequire } from "node:module";

import { drizzle } from "drizzle-orm/better-sqlite3";
import { useRuntimeConfig } from "#imports";

import * as schema from "../db/schema";

export {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  like,
  or,
  sql,
} from "drizzle-orm";

export const tables = schema;

function configuredDatabasePath(): string {
  if (process.env.DATABASE_PATH?.trim()) return process.env.DATABASE_PATH.trim();

  try {
    const configured = useRuntimeConfig().databasePath;
    if (typeof configured === "string" && configured.trim()) {
      return configured.trim();
    }
  } catch {
    // Drizzle tooling can import this module outside a Nitro request context.
  }

  return "./sqlite.db";
}

interface SqliteClient {
  pragma(source: string): unknown;
  prepare(source: string): { get(...parameters: unknown[]): unknown };
}

const require = createRequire(import.meta.url);
const BetterSQLite3 = require("better-sqlite3") as new (path: string) => SqliteClient;

function createDatabase(path: string) {
  const sqlite = new BetterSQLite3(path);
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("busy_timeout = 5000");

  return {
    orm: drizzle(sqlite as never, { schema }),
    sqlite,
  };
}

type DatabaseState = ReturnType<typeof createDatabase>;
let state: DatabaseState | undefined;
let statePath: string | undefined;

export function getDatabase() {
  const path = configuredDatabasePath();
  if (!state) {
    state = createDatabase(path);
    statePath = path;
  } else if (statePath !== path) {
    throw new Error("DATABASE_PATH cannot change after the database is opened");
  }
  return state.orm;
}

export function getSqliteClient() {
  getDatabase();
  return state!.sqlite;
}

type AppDatabase = ReturnType<typeof getDatabase>;

/** Lazy proxy keeps existing auto-imported `db` call sites runtime-configurable. */
export const db = new Proxy({} as AppDatabase, {
  get(_target, property) {
    const database = getDatabase();
    const value = Reflect.get(database, property, database);
    return typeof value === "function" ? value.bind(database) : value;
  },
});
