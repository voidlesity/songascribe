defineRouteMeta({
  openAPI: {
    tags: ["Public"],
    summary: "List public categories",
    parameters: [
      { in: "query", name: "search", schema: { type: "string" } },
      {
        in: "query",
        name: "page",
        schema: { type: "integer", minimum: 1, default: 1 },
      },
      {
        in: "query",
        name: "limit",
        schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
      },
    ],
    responses: { 200: { description: "Paginated list" } },
  },
});

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const offset = (page - 1) * limit;
  const search = typeof query.search === "string" ? query.search.trim() : "";

  const whereExpr = search
    ? and(
        eq(tables.categories.isPublic, true),
        sql`LOWER(${tables.categories.name}) LIKE ${"%" + search.toLowerCase() + "%"}`,
      )
    : eq(tables.categories.isPublic, true);

  const totalRow = db
    .select({ count: count() })
    .from(tables.categories)
    .where(whereExpr)
    .get();
  const total = totalRow?.count ?? 0;

  const rows = await db
    .select({
      category: tables.categories,
      owner: {
        username: tables.users.username,
        avatar: tables.users.avatar,
      },
    })
    .from(tables.categories)
    .leftJoin(tables.users, eq(tables.categories.userId, tables.users.id))
    .where(whereExpr)
    .orderBy(desc(tables.categories.createdAt))
    .limit(limit)
    .offset(offset);

  const categories = await Promise.all(
    rows.map(async ({ category, owner }) => {
      const itemCountRow = db
        .select({ count: count() })
        .from(tables.items)
        .where(eq(tables.items.categoryId, category.id))
        .get();
      const itemCount = itemCountRow?.count ?? 0;

      const trackCountRow = db
        .select({
          count: sql<number>`COUNT(DISTINCT ${tables.itemTracks.trackId})`,
        })
        .from(tables.itemTracks)
        .innerJoin(tables.items, eq(tables.itemTracks.itemId, tables.items.id))
        .where(eq(tables.items.categoryId, category.id))
        .get();
      const trackCount = trackCountRow?.count ?? 0;

      return {
        id: category.id,
        name: category.name,
        description: category.description,
        createdAt: category.createdAt,
        itemCount,
        trackCount,
        owner: owner
          ? {
              username: owner.username,
              avatar: owner.avatar,
            }
          : null,
      };
    }),
  );

  return {
    data: categories,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
});
