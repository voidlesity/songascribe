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

  // Get unique songs
  const uniqueSongIds = [...new Set(allSongMappings.map((m) => m.song))];
  const allSongs =
    uniqueSongIds.length > 0
      ? await db
          .select()
          .from(tables.songs)
          .where(
            sql`${tables.songs.id} IN (${sql.join(
              uniqueSongIds.map((id) => sql`${id}`),
              sql`, `,
            )})`,
          )
      : [];

  // Calculate statistics
  const totalCategories = userCategories.length;
  const totalItems = allItems.length;
  const totalSongs = uniqueSongIds.length;
  const totalSongMappings = allSongMappings.length;

  // Most used songs
  const songUsageMap = new Map<number, number>();
  allSongMappings.forEach((mapping) => {
    const count = songUsageMap.get(mapping.song!) || 0;
    songUsageMap.set(mapping.song!, count + 1);
  });

  const mostUsedSongs = Array.from(songUsageMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([songId, count]) => {
      const song = allSongs.find((s) => s.id === songId);
      return {
        id: song?.id,
        name: song?.name,
        artist: song?.artist,
        album_art: song?.image,
        track_id: song?.track_id,
        source: song?.source,
        usageCount: count,
      };
    });

  // Category statistics
  const categoryStats = await Promise.all(
    userCategories.map(async (category) => {
      const items = allItems.filter((item) => item.categorie === category.id);
      const itemIds = items.map((i) => i.id);
      const songMappings = allSongMappings.filter((m) =>
        itemIds.includes(m.item!),
      );
      const uniqueSongs = new Set(songMappings.map((m) => m.song));

      return {
        id: category.id,
        name: category.name,
        itemCount: items.length,
        songCount: uniqueSongs.size,
        isPublic: category.is_public,
      };
    }),
  );

  // Artist statistics
  const artistMap = new Map<string, number>();
  allSongs.forEach((song) => {
    if (song.artist) {
      const count = artistMap.get(song.artist) || 0;
      artistMap.set(song.artist, count + 1);
    }
  });

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

  // Total listening time (if duration data available)
  const totalDuration = allSongs.reduce(
    (sum, song) => sum + (song.duration || 0),
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
      avgSongsPerItem: parseFloat(avgSongsPerItem),
      totalDurationMinutes,
      totalDurationHours: parseFloat(totalDurationHours),
    },
    mostUsedSongs,
    categoryStats,
    topArtists,
    recentItems,
  };
});
