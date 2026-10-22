type CategoryRow = typeof tables.categories.$inferSelect;
type ItemRow = typeof tables.items.$inferSelect;
type TrackRow = typeof tables.tracks.$inferSelect;
type ShareRow = typeof tables.shares.$inferSelect;

export function serializeShare(share: ShareRow) {
  return {
    token: share.token,
    url: `/share/${share.token}`,
    createdAt: share.createdAt,
    expiresAt: share.expiresAt,
  };
}

function serializeTrack(track: TrackRow, reason: string | null) {
  return {
    id: track.id,
    encoded: track.encoded,
    identifier: track.identifier,
    source: track.source,
    title: track.title,
    author: track.author,
    lengthMs: track.lengthMs,
    uri: track.uri,
    artworkUrl: track.artworkUrl,
    isrc: track.isrc,
    isStream: track.isStream,
    isSeekable: track.isSeekable,
    reason,
  };
}

type SerializedTrack = ReturnType<typeof serializeTrack>;

export function serializeCategory(category: CategoryRow) {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    isPublic: category.isPublic,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

function serializeItem(item: ItemRow, tracks: SerializedTrack[]) {
  return {
    id: item.id,
    categoryId: item.categoryId,
    name: item.name,
    description: item.description,
    position: item.position,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    tracks,
  };
}

/** Ordered tracks of the given items, fetched with a single query. */
function tracksByItem(itemIds: number[]) {
  const result = new Map<number, SerializedTrack[]>();
  if (itemIds.length === 0) return result;

  const rows = db
    .select({
      itemId: tables.itemTracks.itemId,
      reason: tables.itemTracks.reason,
      track: tables.tracks,
    })
    .from(tables.itemTracks)
    .innerJoin(tables.tracks, eq(tables.itemTracks.trackId, tables.tracks.id))
    .where(inArray(tables.itemTracks.itemId, itemIds))
    .orderBy(asc(tables.itemTracks.position), asc(tables.itemTracks.id))
    .all();

  for (const row of rows) {
    const tracks = result.get(row.itemId) ?? [];
    tracks.push(serializeTrack(row.track, row.reason));
    result.set(row.itemId, tracks);
  }
  return result;
}

export function itemWithTracks(item: ItemRow) {
  return serializeItem(item, tracksByItem([item.id]).get(item.id) ?? []);
}

/** Categories with their ordered items and tracks, in three queries total. */
export function categoriesWithItems(categories: CategoryRow[]) {
  const items =
    categories.length === 0
      ? []
      : db
          .select()
          .from(tables.items)
          .where(
            inArray(
              tables.items.categoryId,
              categories.map((category) => category.id),
            ),
          )
          .orderBy(asc(tables.items.position), asc(tables.items.id))
          .all();
  const tracks = tracksByItem(items.map((item) => item.id));

  const itemsByCategory = new Map<number, ReturnType<typeof serializeItem>[]>();
  for (const item of items) {
    const list = itemsByCategory.get(item.categoryId) ?? [];
    list.push(serializeItem(item, tracks.get(item.id) ?? []));
    itemsByCategory.set(item.categoryId, list);
  }

  return categories.map((category) => ({
    ...serializeCategory(category),
    items: itemsByCategory.get(category.id) ?? [],
  }));
}

export function categoryWithItems(category: CategoryRow) {
  return categoriesWithItems([category])[0]!;
}

export function requireOwnedCategory(categoryId: number, userId: number) {
  const category = db
    .select()
    .from(tables.categories)
    .where(
      and(
        eq(tables.categories.id, categoryId),
        eq(tables.categories.userId, userId),
      ),
    )
    .get();
  if (!category) {
    throw createError({ statusCode: 404, statusMessage: "Category not found" });
  }
  return category;
}

export function requireOwnedItem(itemId: number, userId: number) {
  const row = db
    .select({ item: tables.items })
    .from(tables.items)
    .innerJoin(
      tables.categories,
      eq(tables.items.categoryId, tables.categories.id),
    )
    .where(
      and(eq(tables.items.id, itemId), eq(tables.categories.userId, userId)),
    )
    .get();
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: "Item not found" });
  }
  return row.item;
}

function upsertTrack(tx: Transaction, track: Track): number {
  const now = new Date();
  const values = {
    identifier: track.identifier,
    source: track.source,
    title: track.title,
    author: track.author,
    lengthMs: track.lengthMs,
    uri: track.uri,
    artworkUrl: track.artworkUrl,
    isrc: track.isrc,
    isStream: track.isStream,
    isSeekable: track.isSeekable,
    updatedAt: now,
  };
  return tx
    .insert(tables.tracks)
    .values({ ...values, encoded: track.encoded, createdAt: now })
    .onConflictDoUpdate({ target: tables.tracks.encoded, set: values })
    .returning({ id: tables.tracks.id })
    .get().id;
}

/** Replace an item's tracks with the given ordered list. */
export function setItemTracks(
  tx: Transaction,
  itemId: number,
  tracks: Track[],
) {
  tx.delete(tables.itemTracks)
    .where(eq(tables.itemTracks.itemId, itemId))
    .run();
  if (tracks.length === 0) return;

  const addedAt = new Date();
  tx.insert(tables.itemTracks)
    .values(
      tracks.map((track, position) => ({
        itemId,
        trackId: upsertTrack(tx, track),
        position,
        reason: track.reason?.trim() || null,
        addedAt,
      })),
    )
    .run();
}
