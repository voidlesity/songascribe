defineRouteMeta({
  openAPI: {
    tags: ["Categories"],
    summary: "Get public category",
    description: "Returns items and songs for a single public category.",
    parameters: [
      {
        in: "path",
        name: "id",
        required: true,
        schema: { type: "integer" },
        description: "Category ID",
      },
    ],
    responses: {
      200: {
        description: "Public category with items",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                id: { type: "integer" },
                name: { type: "string" },
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "integer" },
                      name: { type: "string" },
                      songs: { type: "array", items: { type: "object" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      400: { description: "Invalid category ID" },
      404: { description: "Category not found or not public" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const categoryId = parseInt(getRouterParam(event, "id") || "0");

  if (!categoryId) {
    throw createError({
      statusCode: 400,
      message: "Invalid category ID",
    });
  }

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
    items: itemsWithSongs,
  };
});
