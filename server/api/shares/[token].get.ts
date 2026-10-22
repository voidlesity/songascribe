defineRouteMeta({
  openAPI: {
    tags: ["Share"],
    summary: "Resolve share token",
    description: "Public endpoint that resolves a non-expired share token.",
    parameters: [
      {
        in: "path",
        name: "token",
        required: true,
        schema: { type: "string" },
      },
    ],
    responses: {
      200: { description: "Shared category with items and tracks" },
      404: { description: "Share not found or expired" },
    },
  },
});

export default defineEventHandler((event) => {
  const token = getRouterParam(event, "token") ?? "";
  const row = db
    .select({ category: tables.categories, expiresAt: tables.shares.expiresAt })
    .from(tables.shares)
    .innerJoin(
      tables.categories,
      eq(tables.shares.categoryId, tables.categories.id),
    )
    .where(eq(tables.shares.token, token))
    .get();
  if (!row || (row.expiresAt && row.expiresAt <= new Date())) {
    throw createError({ statusCode: 404, statusMessage: "Share not found" });
  }

  const { id, name, description, items } = categoryWithItems(row.category);
  return { id, name, description, items };
});
