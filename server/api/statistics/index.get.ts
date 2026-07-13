import { requireSessionUserId } from "../../utils/validation";

defineRouteMeta({
  openAPI: {
    tags: ["Statistics"],
    summary: "User statistics",
    description:
      "Aggregated usage statistics for the authenticated user, computed via SQL.",
    responses: {
      200: { description: "Statistics" },
      401: { description: "Unauthorized" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const userId = await requireSessionUserId(event);

  const overviewRow = db
    .select({
      totalCategories: sql<number>`COUNT(DISTINCT ${tables.categories.id})`,
      totalItems: sql<number>`COUNT(DISTINCT ${tables.items.id})`,
      totalTrackLinks: sql<number>`COUNT(${tables.itemTracks.id})`,
      uniqueTracks: sql<number>`COUNT(DISTINCT ${tables.itemTracks.trackId})`,
    })
    .from(tables.categories)
    .leftJoin(tables.items, eq(tables.items.categoryId, tables.categories.id))
    .leftJoin(tables.itemTracks, eq(tables.itemTracks.itemId, tables.items.id))
    .where(eq(tables.categories.userId, userId))
    .get();

  const distinctTracks = await db
    .selectDistinct({
      id: tables.tracks.id,
      lengthMs: tables.tracks.lengthMs,
    })
    .from(tables.tracks)
    .innerJoin(
      tables.itemTracks,
      eq(tables.itemTracks.trackId, tables.tracks.id),
    )
    .innerJoin(tables.items, eq(tables.itemTracks.itemId, tables.items.id))
    .innerJoin(
      tables.categories,
      eq(tables.items.categoryId, tables.categories.id),
    )
    .where(eq(tables.categories.userId, userId));

  const totalDurationMs = distinctTracks.reduce(
    (sum, t) => sum + (t.lengthMs ?? 0),
    0,
  );
  const totalItems = overviewRow?.totalItems ?? 0;
  const totalTrackLinks = overviewRow?.totalTrackLinks ?? 0;

  const mostUsedTracks = await db
    .select({
      track: tables.tracks,
      usageCount: sql<number>`COUNT(${tables.itemTracks.id})`,
    })
    .from(tables.itemTracks)
    .innerJoin(tables.tracks, eq(tables.itemTracks.trackId, tables.tracks.id))
    .innerJoin(tables.items, eq(tables.itemTracks.itemId, tables.items.id))
    .innerJoin(
      tables.categories,
      eq(tables.items.categoryId, tables.categories.id),
    )
    .where(eq(tables.categories.userId, userId))
    .groupBy(tables.tracks.id)
    .orderBy(desc(sql`COUNT(${tables.itemTracks.id})`))
    .limit(10);

  const topArtists = await db
    .select({
      name: tables.tracks.author,
      trackCount: sql<number>`COUNT(DISTINCT ${tables.tracks.id})`,
    })
    .from(tables.tracks)
    .innerJoin(
      tables.itemTracks,
      eq(tables.itemTracks.trackId, tables.tracks.id),
    )
    .innerJoin(tables.items, eq(tables.itemTracks.itemId, tables.items.id))
    .innerJoin(
      tables.categories,
      eq(tables.items.categoryId, tables.categories.id),
    )
    .where(eq(tables.categories.userId, userId))
    .groupBy(tables.tracks.author)
    .orderBy(desc(sql`COUNT(DISTINCT ${tables.tracks.id})`))
    .limit(10);

  const categoryStats = await db
    .select({
      id: tables.categories.id,
      name: tables.categories.name,
      isPublic: tables.categories.isPublic,
      itemCount: sql<number>`COUNT(DISTINCT ${tables.items.id})`,
      trackCount: sql<number>`COUNT(DISTINCT ${tables.itemTracks.trackId})`,
    })
    .from(tables.categories)
    .leftJoin(tables.items, eq(tables.items.categoryId, tables.categories.id))
    .leftJoin(tables.itemTracks, eq(tables.itemTracks.itemId, tables.items.id))
    .where(eq(tables.categories.userId, userId))
    .groupBy(tables.categories.id);

  const recentItems = await db
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
    .where(eq(tables.categories.userId, userId))
    .orderBy(desc(tables.items.createdAt))
    .limit(10);

  return {
    overview: {
      totalCategories: overviewRow?.totalCategories ?? 0,
      totalItems,
      totalTracks: overviewRow?.uniqueTracks ?? 0,
      totalTrackLinks,
      avgTracksPerItem:
        totalItems > 0 ? Number((totalTrackLinks / totalItems).toFixed(2)) : 0,
      totalDurationMs,
      totalDurationMinutes: Math.floor(totalDurationMs / 60_000),
      totalDurationHours: Number((totalDurationMs / 3_600_000).toFixed(2)),
    },
    mostUsedTracks: mostUsedTracks.map((r) => ({
      id: r.track.id,
      encoded: r.track.encoded,
      title: r.track.title,
      author: r.track.author,
      source: r.track.source,
      uri: r.track.uri,
      artworkUrl: r.track.artworkUrl,
      lengthMs: r.track.lengthMs,
      usageCount: r.usageCount,
    })),
    topArtists,
    categoryStats,
    recentItems,
  };
});
