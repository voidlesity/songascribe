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
      const songMappings = await db
        .select()
        .from(tables.songsMap)
        .where(eq(tables.songsMap.item, item.id));

      const songs = songMappings
        .map((m) => {
          try {
            return m.song ? JSON.parse(m.song) : null;
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      return {
        id: item.id,
        name: item.name,
        songs,
      };
    }),
  );

  return {
    id: category.id,
    name: category.name,
    items: itemsWithSongs,
  };
});
