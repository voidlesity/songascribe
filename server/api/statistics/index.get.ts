defineRouteMeta({
  openAPI: {
    tags: ["Statistics"],
    summary: "User statistics",
    description: "Aggregated usage statistics for the authenticated user.",
    responses: {
      200: { description: "Statistics" },
      401: { description: "Unauthorized" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const ownCategory = eq(tables.categories.userId, user.id);
  const distinctItems = sql<number>`count(distinct ${tables.items.id})`;
  const distinctTracks = sql<number>`count(distinct ${tables.itemTracks.trackId})`;

  const overview = db
    .select({
      categories: sql<number>`count(distinct ${tables.categories.id})`,
      items: distinctItems,
      tracks: distinctTracks,
      trackLinks: count(tables.itemTracks.id),
    })
    .from(tables.categories)
    .leftJoin(tables.items, eq(tables.items.categoryId, tables.categories.id))
    .leftJoin(tables.itemTracks, eq(tables.itemTracks.itemId, tables.items.id))
    .where(ownCategory)
    .get()!;

  const ownTrackIds = db
    .selectDistinct({ id: tables.itemTracks.trackId })
    .from(tables.itemTracks)
    .innerJoin(tables.items, eq(tables.itemTracks.itemId, tables.items.id))
    .innerJoin(
      tables.categories,
      eq(tables.items.categoryId, tables.categories.id),
    )
    .where(ownCategory);
  const totalDurationMs = db
    .select({ value: sql<number>`coalesce(sum(${tables.tracks.lengthMs}), 0)` })
    .from(tables.tracks)
    .where(inArray(tables.tracks.id, ownTrackIds))
    .get()!.value;

  const usageCount = count(tables.itemTracks.id);
  const mostUsedTracks = db
    .select({
      id: tables.tracks.id,
      encoded: tables.tracks.encoded,
      title: tables.tracks.title,
      author: tables.tracks.author,
      source: tables.tracks.source,
      uri: tables.tracks.uri,
      artworkUrl: tables.tracks.artworkUrl,
      lengthMs: tables.tracks.lengthMs,
      usageCount,
    })
    .from(tables.itemTracks)
    .innerJoin(tables.tracks, eq(tables.itemTracks.trackId, tables.tracks.id))
    .innerJoin(tables.items, eq(tables.itemTracks.itemId, tables.items.id))
    .innerJoin(
      tables.categories,
      eq(tables.items.categoryId, tables.categories.id),
    )
    .where(ownCategory)
    .groupBy(tables.tracks.id)
    .orderBy(desc(usageCount))
    .limit(10)
    .all();

  const topArtists = db
    .select({ name: tables.tracks.author, trackCount: distinctTracks })
    .from(tables.itemTracks)
    .innerJoin(tables.tracks, eq(tables.itemTracks.trackId, tables.tracks.id))
    .innerJoin(tables.items, eq(tables.itemTracks.itemId, tables.items.id))
    .innerJoin(
      tables.categories,
      eq(tables.items.categoryId, tables.categories.id),
    )
    .where(ownCategory)
    .groupBy(tables.tracks.author)
    .orderBy(desc(distinctTracks))
    .limit(10)
    .all();

  const categoryStats = db
    .select({
      id: tables.categories.id,
      name: tables.categories.name,
      isPublic: tables.categories.isPublic,
      itemCount: distinctItems,
      trackCount: distinctTracks,
    })
    .from(tables.categories)
    .leftJoin(tables.items, eq(tables.items.categoryId, tables.categories.id))
    .leftJoin(tables.itemTracks, eq(tables.itemTracks.itemId, tables.items.id))
    .where(ownCategory)
    .groupBy(tables.categories.id)
    .all();

  const recentItems = db
    .select({
      id: tables.items.id,
      name: tables.items.name,
      createdAt: tables.items.createdAt,
      categoryId: tables.categories.id,
      categoryName: tables.categories.name,
    })
    .from(tables.items)
    .innerJoin(
      tables.categories,
      eq(tables.items.categoryId, tables.categories.id),
    )
    .where(ownCategory)
    .orderBy(desc(tables.items.createdAt))
    .limit(10)
    .all();

  return {
    overview: {
      totalCategories: overview.categories,
      totalItems: overview.items,
      totalTracks: overview.tracks,
      totalTrackLinks: overview.trackLinks,
      avgTracksPerItem: overview.items
        ? Number((overview.trackLinks / overview.items).toFixed(2))
        : 0,
      totalDurationMs,
      totalDurationMinutes: Math.floor(totalDurationMs / 60_000),
      totalDurationHours: Number((totalDurationMs / 3_600_000).toFixed(2)),
    },
    mostUsedTracks,
    topArtists,
    categoryStats,
    recentItems,
  };
});
