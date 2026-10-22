defineRouteMeta({
  openAPI: {
    tags: ["Categories"],
    summary: "Get category",
    description:
      "Returns a category with ordered items and tracks. Visible to its owner, or to anyone when public.",
    parameters: [
      {
        in: "path",
        name: "id",
        required: true,
        schema: { type: "integer", minimum: 1 },
      },
    ],
    responses: {
      200: { description: "Category with items and tracks" },
      400: { description: "Invalid category id" },
      404: { description: "Category not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const id = parseRouteId(event, "category");
  const category = db
    .select()
    .from(tables.categories)
    .where(eq(tables.categories.id, id))
    .get();

  const { user } = await getUserSession(event);
  if (!category || (!category.isPublic && category.userId !== user?.id)) {
    throw createError({ statusCode: 404, statusMessage: "Category not found" });
  }

  return categoryWithItems(category);
});
