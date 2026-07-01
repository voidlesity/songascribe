defineRouteMeta({
  openAPI: {
    tags: ["Share"],
    summary: "Resolve share token",
    description: "Public endpoint, resolves a share token to its category.",
    parameters: [
      { in: "path", name: "token", required: true, schema: { type: "string" } },
    ],
    responses: {
      200: { description: "Shared category" },
      400: { description: "Missing token" },
      404: { description: "Share not found or expired" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, "token");
  if (!token) {
    throw createError({ statusCode: 400, statusMessage: "Missing token" });
  }

  const share = db
    .select()
    .from(tables.shares)
    .where(eq(tables.shares.token, token))
    .get();

  if (!share) {
    throw createError({ statusCode: 404, statusMessage: "Share not found" });
  }
  if (share.expiresAt && share.expiresAt.getTime() < Date.now()) {
    throw createError({ statusCode: 404, statusMessage: "Share has expired" });
  }

  const category = db
    .select()
    .from(tables.categories)
    .where(eq(tables.categories.id, share.categoryId))
    .get();
  if (!category) {
    throw createError({ statusCode: 404, statusMessage: "Category not found" });
  }

  const its = await db
    .select()
    .from(tables.items)
    .where(eq(tables.items.categoryId, category.id))
    .orderBy(asc(tables.items.position), asc(tables.items.id));

  const items = await Promise.all(
    its.map(async (i) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      position: i.position,
      tracks: await getItemTracks(i.id),
    })),
  );

  return {
    id: category.id,
    name: category.name,
    description: category.description,
    items,
  };
});
