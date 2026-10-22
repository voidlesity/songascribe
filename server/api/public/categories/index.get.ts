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
    responses: {
      200: { description: "Paginated public category summaries" },
      400: { description: "Invalid pagination or search parameters" },
    },
  },
});

export default defineEventHandler((event) => {
  const query = getQuery(event);
  const page = parseInteger(query.page ?? 1, "page", { min: 1 });
  const limit = parseInteger(query.limit ?? 20, "limit", { min: 1, max: 100 });
  const search =
    query.search === undefined || query.search === ""
      ? ""
      : requiredString(query.search, "search", 200);

  const where = and(
    eq(tables.categories.isPublic, true),
    search
      ? like(sql`lower(${tables.categories.name})`, `%${search.toLowerCase()}%`)
      : undefined,
  );

  const total =
    db.select({ total: count() }).from(tables.categories).where(where).get()
      ?.total ?? 0;

  const rows = db
    .select({
      id: tables.categories.id,
      name: tables.categories.name,
      description: tables.categories.description,
      createdAt: tables.categories.createdAt,
      itemCount: sql<number>`count(distinct ${tables.items.id})`,
      trackCount: sql<number>`count(distinct ${tables.itemTracks.trackId})`,
      ownerUsername: tables.users.username,
      ownerAvatar: tables.users.avatar,
    })
    .from(tables.categories)
    .leftJoin(tables.users, eq(tables.categories.userId, tables.users.id))
    .leftJoin(tables.items, eq(tables.items.categoryId, tables.categories.id))
    .leftJoin(tables.itemTracks, eq(tables.itemTracks.itemId, tables.items.id))
    .where(where)
    .groupBy(tables.categories.id)
    .orderBy(desc(tables.categories.createdAt))
    .limit(limit)
    .offset((page - 1) * limit)
    .all();

  return {
    data: rows.map(({ ownerUsername, ownerAvatar, ...category }) => ({
      ...category,
      owner: ownerUsername
        ? { username: ownerUsername, avatar: ownerAvatar }
        : null,
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
});
