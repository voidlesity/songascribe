export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);

  // Get categories for the user
  const userCategories = await db
    .select()
    .from(tables.categories)
    .where(eq(tables.categories.user, user.id));

  // For each category, get items with their songs
  const categoriesWithItems = await Promise.all(
    userCategories.map(async (category) => {
      const categoryItems = await db
        .select()
        .from(tables.items)
        .where(eq(tables.items.categorie, category.id));

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
        is_public: category.is_public,
        created_at: category.created_at,
        items: itemsWithSongs,
      };
    }),
  );

  return categoriesWithItems;
});
