export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);

  // Get all categories for the user
  const userCategories = await db
    .select()
    .from(tables.categories)
    .where(eq(tables.categories.user, user.id));

  // Get all items across all categories
  const categoryIds = userCategories.map((c) => c.id);
  const allItems =
    categoryIds.length > 0
      ? await db
          .select()
          .from(tables.items)
          .where(
            sql`${tables.items.categorie} IN (${sql.join(
              categoryIds.map((id) => sql`${id}`),
              sql`, `,
            )})`,
          )
      : [];

  // Get all song mappings for these items
  const itemIds = allItems.map((i) => i.id);
  const allSongMappings =
    itemIds.length > 0
      ? await db
          .select()
          .from(tables.songsMap)
          .where(
            sql`${tables.songsMap.item} IN (${sql.join(
              itemIds.map((id) => sql`${id}`),
              sql`, `,
            )})`,
          )
      : [];

  // Parse raw Lavalink track JSON from each mapping
  const allTracks = allSongMappings
    .map((m) => {
      try {
        return m.song ? JSON.parse(m.song) : null;
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  // Deduplicate tracks by encoded string
  const uniqueTracksMap = new Map<string, any>();
  for (const track of allTracks) {
    if (track.encoded && !uniqueTracksMap.has(track.encoded)) {
      uniqueTracksMap.set(track.encoded, track);
    }
  }
  const uniqueTracks = Array.from(uniqueTracksMap.values());

  // Calculate statistics
  const totalCategories = userCategories.length;
  const totalItems = allItems.length;
  const totalSongs = uniqueTracks.length;
  const totalSongMappings = allSongMappings.length;

  // Most used songs (by encoded string frequency)
  const songUsageMap = new Map<string, number>();
  for (const track of allTracks) {
    if (track.encoded) {
      const count = songUsageMap.get(track.encoded) || 0;
      songUsageMap.set(track.encoded, count + 1);
    }
  }

  const mostUsedSongs = Array.from(songUsageMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([encoded, count]) => {
      const track = uniqueTracksMap.get(encoded);
      return {
        ...track,
        usageCount: count,
      };
    });

  // Category statistics
  const categoryStats = userCategories.map((category) => {
    const items = allItems.filter((item) => item.categorie === category.id);
    const catItemIds = items.map((i) => i.id);
    const catMappings = allSongMappings.filter((m) =>
      catItemIds.includes(m.item!),
    );

    const catTracks = catMappings
      .map((m) => {
        try {
          return m.song ? JSON.parse(m.song) : null;
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    const uniqueEncodedSet = new Set(
      catTracks.map((t: any) => t.encoded).filter(Boolean),
    );

    return {
      id: category.id,
      name: category.name,
      itemCount: items.length,
      songCount: uniqueEncodedSet.size,
      isPublic: category.is_public,
    };
  });

  // Artist statistics
  const artistMap = new Map<string, number>();
  for (const track of uniqueTracks) {
    const author = track.info?.author;
    if (author) {
      const count = artistMap.get(author) || 0;
      artistMap.set(author, count + 1);
    }
  }

  const topArtists = Array.from(artistMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([artist, count]) => ({
      name: artist,
      songCount: count,
    }));

  // Recent activity (last 10 items created)
  const recentItems = allItems
    .sort((a, b) => (b.id || 0) - (a.id || 0))
    .slice(0, 10)
    .map((item) => {
      const category = userCategories.find((c) => c.id === item.categorie);
      return {
        id: item.id,
        name: item.name,
        categoryName: category?.name,
      };
    });

  // Average songs per item
  const avgSongsPerItem =
    totalItems > 0 ? (totalSongMappings / totalItems).toFixed(2) : 0;

  // Total listening time from Lavalink track lengths (in ms)
  const totalDuration = uniqueTracks.reduce(
    (sum: number, track: any) => sum + (track.info?.length || 0),
    0,
  );
  const totalDurationMinutes = Math.floor(totalDuration / 60000);
  const totalDurationHours = (totalDuration / 3600000).toFixed(1);

  return {
    overview: {
      totalCategories,
      totalItems,
      totalSongs,
      totalSongMappings,
      avgSongsPerItem: parseFloat(avgSongsPerItem as string),
      totalDurationMinutes,
      totalDurationHours: parseFloat(totalDurationHours),
    },
    mostUsedSongs,
    categoryStats,
    topArtists,
    recentItems,
  };
});
