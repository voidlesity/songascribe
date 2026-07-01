defineRouteMeta({
  openAPI: {
    tags: ["Public"],
    summary: "Get public category",
    parameters: [
      { in: "path", name: "id", required: true, schema: { type: "integer" } },
    ],
    responses: {
      200: { description: "Public category" },
      400: { description: "Invalid id" },
      404: { description: "Not found or not public" },
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
    .where(
      and(eq(tables.categories.id, id), eq(tables.categories.isPublic, true)),
    )
    .get();

  if (!category) {
    throw createError({ statusCode: 404, statusMessage: "Category not found" });
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
      tracks: await getItemTracks(i.id),
    })),
  );

  return {
    id: category.id,
    name: category.name,
    description: category.description,
    createdAt: category.createdAt,
    items,
  };
});
