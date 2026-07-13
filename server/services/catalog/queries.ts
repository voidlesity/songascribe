import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";

import type { PublicCategorySummary } from "../../../shared/contracts";
import { db, tables } from "../../utils/drizzle";

export type CategoryRow = typeof tables.categories.$inferSelect;
export type ItemRow = typeof tables.items.$inferSelect;
export type TrackRow = typeof tables.tracks.$inferSelect;

export interface CatalogTrack
  extends Omit<TrackRow, "pluginInfo" | "createdAt" | "updatedAt"> {
  reason: string | null;
}

export interface CatalogItem extends ItemRow {
  tracks: CatalogTrack[];
}

export interface CatalogCategory extends CategoryRow {
  items: CatalogItem[];
}

function mapTrack(
  track: TrackRow,
  reason: string | null,
): CatalogTrack {
  return {
    id: track.id,
    encoded: track.encoded,
    identifier: track.identifier,
    source: track.source,
    uri: track.uri,
    title: track.title,
    author: track.author,
    artworkUrl: track.artworkUrl,
    lengthMs: track.lengthMs,
    isrc: track.isrc,
    isStream: track.isStream,
    isSeekable: track.isSeekable,
    reason,
  };
}

/** Assemble category details with at most one query per table, not per row. */
export function assembleCategoryDetails(
  categories: CategoryRow[],
): CatalogCategory[] {
  if (categories.length === 0) return [];

  const categoryIds = categories.map((category) => category.id);
  const itemRows = db
    .select()
    .from(tables.items)
    .where(inArray(tables.items.categoryId, categoryIds))
    .orderBy(
      asc(tables.items.categoryId),
      asc(tables.items.position),
      asc(tables.items.id),
    )
    .all();

  const itemIds = itemRows.map((item) => item.id);
  const trackRows =
    itemIds.length === 0
      ? []
      : db
          .select({
            itemId: tables.itemTracks.itemId,
            linkPosition: tables.itemTracks.position,
            linkId: tables.itemTracks.id,
            reason: tables.itemTracks.reason,
            track: tables.tracks,
          })
          .from(tables.itemTracks)
          .innerJoin(
            tables.tracks,
            eq(tables.itemTracks.trackId, tables.tracks.id),
          )
          .where(inArray(tables.itemTracks.itemId, itemIds))
          .orderBy(
            asc(tables.itemTracks.itemId),
            asc(tables.itemTracks.position),
            asc(tables.itemTracks.id),
          )
          .all();

  const tracksByItem = new Map<number, CatalogTrack[]>();
  for (const row of trackRows) {
    const tracks = tracksByItem.get(row.itemId) ?? [];
    tracks.push(mapTrack(row.track, row.reason));
    tracksByItem.set(row.itemId, tracks);
  }

  const itemsByCategory = new Map<number, CatalogItem[]>();
  for (const item of itemRows) {
    const items = itemsByCategory.get(item.categoryId) ?? [];
    items.push({ ...item, tracks: tracksByItem.get(item.id) ?? [] });
    itemsByCategory.set(item.categoryId, items);
  }

  return categories.map((category) => ({
    ...category,
    items: itemsByCategory.get(category.id) ?? [],
  }));
}

export function getCategoryById(id: number): CategoryRow | undefined {
  return db
    .select()
    .from(tables.categories)
    .where(eq(tables.categories.id, id))
    .get();
}

export function getOwnedCategory(
  id: number,
  userId: number,
): CategoryRow | undefined {
  return db
    .select()
    .from(tables.categories)
    .where(
      and(eq(tables.categories.id, id), eq(tables.categories.userId, userId)),
    )
    .get();
}

export function getCategoryDetail(id: number): CatalogCategory | undefined {
  const category = getCategoryById(id);
  return category ? assembleCategoryDetails([category])[0] : undefined;
}

export function getPublicCategoryDetail(
  id: number,
): CatalogCategory | undefined {
  const category = db
    .select()
    .from(tables.categories)
    .where(
      and(eq(tables.categories.id, id), eq(tables.categories.isPublic, true)),
    )
    .get();
  return category ? assembleCategoryDetails([category])[0] : undefined;
}

export function getOwnedCategoryDetails(userId: number): CatalogCategory[] {
  const categories = db
    .select()
    .from(tables.categories)
    .where(eq(tables.categories.userId, userId))
    .orderBy(asc(tables.categories.createdAt))
    .all();
  return assembleCategoryDetails(categories);
}

export function getOwnedItem(itemId: number, userId: number) {
  return db
    .select({ item: tables.items, category: tables.categories })
    .from(tables.items)
    .innerJoin(
      tables.categories,
      eq(tables.items.categoryId, tables.categories.id),
    )
    .where(
      and(
        eq(tables.items.id, itemId),
        eq(tables.categories.userId, userId),
      ),
    )
    .get();
}

export function getItemWithTracks(itemId: number): CatalogItem | undefined {
  const item = db
    .select()
    .from(tables.items)
    .where(eq(tables.items.id, itemId))
    .get();
  if (!item) return undefined;

  const tracks = db
    .select({ reason: tables.itemTracks.reason, track: tables.tracks })
    .from(tables.itemTracks)
    .innerJoin(tables.tracks, eq(tables.itemTracks.trackId, tables.tracks.id))
    .where(eq(tables.itemTracks.itemId, itemId))
    .orderBy(asc(tables.itemTracks.position), asc(tables.itemTracks.id))
    .all()
    .map((row) => mapTrack(row.track, row.reason));
  return { ...item, tracks };
}

export function listPublicCategories(options: {
  search: string;
  page: number;
  limit: number;
}): { data: PublicCategorySummary[]; total: number } {
  const offset = (options.page - 1) * options.limit;
  const where = options.search
    ? and(
        eq(tables.categories.isPublic, true),
        sql`LOWER(${tables.categories.name}) LIKE ${`%${options.search.toLowerCase()}%`}`,
      )
    : eq(tables.categories.isPublic, true);

  const total =
    db
      .select({ value: count() })
      .from(tables.categories)
      .where(where)
      .get()?.value ?? 0;

  const rows = db
    .select({
      id: tables.categories.id,
      name: tables.categories.name,
      description: tables.categories.description,
      createdAt: tables.categories.createdAt,
      itemCount: sql<number>`COUNT(DISTINCT ${tables.items.id})`,
      trackCount: sql<number>`COUNT(DISTINCT ${tables.itemTracks.trackId})`,
      ownerUsername: tables.users.username,
      ownerAvatar: tables.users.avatar,
    })
    .from(tables.categories)
    .leftJoin(tables.users, eq(tables.categories.userId, tables.users.id))
    .leftJoin(tables.items, eq(tables.items.categoryId, tables.categories.id))
    .leftJoin(
      tables.itemTracks,
      eq(tables.itemTracks.itemId, tables.items.id),
    )
    .where(where)
    .groupBy(tables.categories.id, tables.users.id)
    .orderBy(desc(tables.categories.createdAt))
    .limit(options.limit)
    .offset(offset)
    .all();

  return {
    total,
    data: rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.createdAt.toISOString(),
      itemCount: row.itemCount,
      trackCount: row.trackCount,
      owner: row.ownerUsername
        ? { username: row.ownerUsername, avatar: row.ownerAvatar }
        : null,
    })),
  };
}
