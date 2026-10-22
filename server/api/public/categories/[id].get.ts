defineRouteMeta({
  openAPI: {
    tags: ["Public"],
    summary: "Get public category",
    parameters: [
      {
        in: "path",
        name: "id",
        required: true,
        schema: { type: "integer", minimum: 1 },
      },
    ],
    responses: {
      200: { description: "Public category with items and tracks" },
      400: { description: "Invalid category id" },
      404: { description: "Category not found or not public" },
    },
  },
});

export default defineEventHandler((event) => {
  const id = parseRouteId(event, "category");
  const category = db
    .select()
    .from(tables.categories)
    .where(
      and(eq(tables.categories.id, id), eq(tables.categories.isPublic, true)),
    )
    .get();
  if (!category) {
    throw createError({ statusCode: 404, statusMessage: "Category not found" });
  }

  const { name, description, createdAt, items } = categoryWithItems(category);
  return { id, name, description, createdAt, items };
});
