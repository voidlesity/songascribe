defineRouteMeta({
  openAPI: {
    tags: ["Categories"],
    summary: "List public categories",
    description:
      "Returns a paginated list of all public categories. Supports search by name.",
    parameters: [
      {
        in: "query",
        name: "search",
        schema: { type: "string" },
        description: "Filter by category name",
      },
      { in: "query", name: "page", schema: { type: "integer", default: 1 } },
      { in: "query", name: "limit", schema: { type: "integer", default: 20 } },
    ],
    responses: {
      200: {
        description: "Paginated public categories",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                categories: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "integer" },
                      name: { type: "string" },
                      createdAt: { type: "string", format: "date-time" },
                      itemCount: { type: "integer" },
                      songCount: { type: "integer" },
                      owner: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          avatar: { type: "string", nullable: true },
                        },
                      },
                    },
                  },
                },
                pagination: {
                  type: "object",
                  properties: {
                    page: { type: "integer" },
                    limit: { type: "integer" },
                    total: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { search, page = 1, limit = 20 } = getQuery(event);

  const offset = (Number(page) - 1) * Number(limit);

  // Build query for public categories
  let query = db
    .select({
      category: tables.categories,
      user: tables.users,
    })
    .from(tables.categories)
    .leftJoin(tables.users, eq(tables.categories.user, tables.users.id))
    .where(eq(tables.categories.is_public, true))
    .limit(Number(limit))
    .offset(offset);

  // Execute query
  const publicCategories = await query;

  // Get items and songs for each category
  const categoriesWithData = await Promise.all(
    publicCategories.map(async ({ category, user }) => {
      const categoryItems = await db
        .select()
        .from(tables.items)
        .where(eq(tables.items.categorie, category.id));

      const itemIds = categoryItems.map((i) => i.id);
      const songMappings =
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

      const uniqueSongIds = [...new Set(songMappings.map((m) => m.song))];

      return {
        id: category.id,
        name: category.name,
        createdAt: category.created_at,
        itemCount: categoryItems.length,
        songCount: uniqueSongIds.length,
        owner: {
          name: user?.name,
          avatar: user?.avatar,
        },
      };
    }),
  );

  // Filter by search if provided
  const filteredCategories = search
    ? categoriesWithData.filter((cat) =>
        cat.name.toLowerCase().includes(String(search).toLowerCase()),
      )
    : categoriesWithData;

  return {
    categories: filteredCategories,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: filteredCategories.length,
    },
  };
});
