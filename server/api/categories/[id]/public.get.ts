export default defineEventHandler(async (event) => {
  const categoryId = parseInt(getRouterParam(event, "id") || "0");

  if (!categoryId) {
    throw createError({
      statusCode: 400,
      message: "Invalid category ID",
    });
  }

  // Get the category and verify it's public
  const category = db
    .select()
    .from(tables.categories)
    .where(
      and(
        eq(tables.categories.id, categoryId),
        eq(tables.categories.is_public, true),
      ),
    )
    .get();

  if (!category) {
    throw createError({
      statusCode: 404,
      message: "Category not found or not public",
    });
  }

  // Get items for this category
  const categoryItems = await db
    .select()
    .from(tables.items)
    .where(eq(tables.items.categorie, category.id));

  // Get songs for each item
  const itemsWithSongs = await Promise.all(
    categoryItems.map(async (item) => {
      // Get song mappings for this item
      const songMappings = await db
        .select()
        .from(tables.songsMap)
        .where(eq(tables.songsMap.item, item.id));

      // Get actual song details
      const songIds = songMappings.map((m) => m.song);
      const songs =
        songIds.length > 0
          ? await db
              .select()
              .from(tables.songs)
              .where(
                sql`${tables.songs.id} IN (${sql.join(
                  songIds.map((id) => sql`${id}`),
                  sql`, `,
                )})`,
              )
          : [];

      return {
        id: item.id,
        name: item.name,
        songs: songs.map((song) => ({
          id: song.id,
          name: song.name,
          artist: song.artist,
          album: song.album,
          album_art: song.album_art,
          duration: song.duration,
          url: song.url,
          track_id: song.track_id,
          trackId: song.track_id,
          source: song.source,
          isrc: song.isrc,
        })),
      };
    }),
  );

  return {
    id: category.id,
    name: category.name,
    items: itemsWithSongs,
  };
});
