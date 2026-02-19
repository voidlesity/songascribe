export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);

  const userCategories = await db
    .select()
    .from(tables.categories)
    .where(eq(tables.categories.user, user.id));

  const categoriesWithItems = await Promise.all(
    userCategories.map(async (category) => {
      const categoryItems = await db
        .select()
        .from(tables.items)
        .where(eq(tables.items.categorie, category.id));

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
        is_public: category.is_public,
        created_at: category.created_at,
        items: itemsWithSongs,
      };
    }),
  );

  return categoriesWithItems;
});
