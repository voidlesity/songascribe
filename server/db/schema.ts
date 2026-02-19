import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  theme: text("theme").default("dark"),
  created_at: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user: integer("user").references(() => users.id),
  name: text("name"),
  is_public: integer("is_public", { mode: "boolean" }).default(false),
  created_at: integer("created_at", { mode: "timestamp" }),
});

export const items = sqliteTable("items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categorie: integer("categorie").references(() => categories.id),
  name: text("name"),
});

export const songs = sqliteTable("songs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  track_id: text("track_id").unique(),
  name: text("name"),
  artist: text("artist"),
  image: text("album_art"),
  duration: integer("duration"),
  url: text("url"),
  source: text("source"),
});

export const songsMap = sqliteTable("songs_map", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  item: integer("item").references(() => items.id),
  song: integer("song").references(() => songs.id),
});

export const shares = sqliteTable("shares", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  category: integer("category").references(() => categories.id),
  share_token: text("share_token").notNull().unique(),
  created_at: integer("created_at", { mode: "timestamp" }).notNull(),
});
