import {
  blob,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  avatar: text("avatar"),
  avatarData: blob("avatar_data", { mode: "buffer" }),
  avatarMime: text("avatar_mime"),
  theme: text("theme").notNull().default("dark"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const categories = sqliteTable(
  "categories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    isPublic: integer("is_public", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("categories_user_id_idx").on(table.userId),
    index("categories_public_created_at_idx").on(
      table.isPublic,
      table.createdAt,
    ),
  ],
);

export const items = sqliteTable(
  "items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    position: integer("position").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("items_category_position_idx").on(
      table.categoryId,
      table.position,
      table.id,
    ),
  ],
);

export const tracks = sqliteTable("tracks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  encoded: text("encoded").notNull().unique(),
  identifier: text("identifier").notNull(),
  source: text("source").notNull(),
  uri: text("uri"),
  title: text("title").notNull(),
  author: text("author").notNull(),
  artworkUrl: text("artwork_url"),
  lengthMs: integer("length_ms").notNull().default(0),
  isrc: text("isrc"),
  isStream: integer("is_stream", { mode: "boolean" }).notNull().default(false),
  isSeekable: integer("is_seekable", { mode: "boolean" })
    .notNull()
    .default(true),
  pluginInfo: text("plugin_info"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const itemTracks = sqliteTable(
  "item_tracks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    itemId: integer("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    trackId: integer("track_id")
      .notNull()
      .references(() => tracks.id),
    position: integer("position").notNull().default(0),
    reason: text("reason"),
    addedAt: integer("added_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("item_tracks_item_position_idx").on(
      table.itemId,
      table.position,
      table.id,
    ),
    index("item_tracks_track_id_idx").on(table.trackId),
  ],
);

export const shares = sqliteTable(
  "shares",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    categoryId: integer("category_id")
      .notNull()
      .unique()
      .references(() => categories.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }),
  },
  (table) => [index("shares_expires_at_idx").on(table.expiresAt)],
);
