defineRouteMeta({
  openAPI: {
    tags: ["Categories"],
    summary: "Get category",
    description:
      "Returns a category with items and tracks. Visible to the owner, or to anyone if `isPublic` is true.",
    parameters: [
      {
        in: "path",
        name: "id",
        required: true,
        schema: { type: "integer" },
      },
    ],
    responses: {
      200: { description: "Category" },
      400: { description: "Invalid id" },
      404: { description: "Not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid category id",
    });
  }

  const category = db
    .select()
    .from(tables.categories)
    .where(eq(tables.categories.id, id))
    .get();

  if (!category) {
    throw createError({ statusCode: 404, statusMessage: "Category not found" });
  }

  if (!category.isPublic) {
    const session = await getUserSession(event);
    const userId = (session.user as { id?: number } | undefined)?.id;
    if (userId !== category.userId) {
      throw createError({
        statusCode: 404,
        statusMessage: "Category not found",
      });
    }
  }

  const its = await db
    .select()
    .from(tables.items)
    .where(eq(tables.items.categoryId, id))
    .orderBy(asc(tables.items.position), asc(tables.items.id));

  const items = await Promise.all(
    its.map(async (i) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      position: i.position,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
      tracks: await getItemTracks(i.id),
    })),
  );

  return {
    id: category.id,
    name: category.name,
    description: category.description,
    isPublic: category.isPublic,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
    items,
  };
});
