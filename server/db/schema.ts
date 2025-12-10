import { sqliteTable, integer, text, blob } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  avatar: text("avatar").notNull(),
  settings: blob({ mode: "json" }),
});

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user: integer("user").references(() => users.id),
  name: text("name"),
});

export const items = sqliteTable("items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categorie: integer("categorie").references(() => categories.id),
  name: text("name"),
});

export const songs = sqliteTable("songs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name"),
  artist: text("artist"),
  url: text("url"),
});

export const songsMap = sqliteTable("songs_map", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  item: integer("item").references(() => items.id),
  song: integer("song").references(() => songs.id),
});
