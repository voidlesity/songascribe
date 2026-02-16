export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, "token");

  if (!token) {
    throw createError({
      statusCode: 400,
      message: "Share token is required",
    });
  }

  // Find the share
  const share = db
    .select()
    .from(tables.shares)
    .where(eq(tables.shares.share_token, token))
    .get();

  if (!share) {
    throw createError({
      statusCode: 404,
      message: "Share not found",
    });
  }

  // Get the category
  const category = db
    .select()
    .from(tables.categories)
    .where(eq(tables.categories.id, share.category))
    .get();

  if (!category) {
    throw createError({
      statusCode: 404,
      message: "Category not found",
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
          url: song.url,
          spotifyId: song.url?.split("/").pop()?.split("?")[0] || null,
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
