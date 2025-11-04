import { sqliteTable, integer, text, blob } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  avatar: text("avatar").notNull(),
});

export const data = sqliteTable("data", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user: integer("user").references(() => users.id),
  data: blob({ mode: "json" }),
});
