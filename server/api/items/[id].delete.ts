defineRouteMeta({
  openAPI: {
    tags: ["Items"],
    summary: "Delete item",
    description:
      "Delete an item and its song mappings. The item must belong to the authenticated user.",
    parameters: [
      {
        in: "path",
        name: "id",
        required: true,
        schema: { type: "integer" },
        description: "Item ID",
      },
    ],
    responses: {
      200: {
        description: "Deletion result",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: { success: { type: "boolean" } },
            },
          },
        },
      },
      400: { description: "Invalid item ID" },
      401: { description: "Unauthorized" },
      404: { description: "Item not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const itemId = parseInt(getRouterParam(event, "id") || "0");

  if (!itemId) {
    throw createError({
      statusCode: 400,
      message: "Invalid item ID",
    });
  }

  // Get the item and verify it belongs to a category owned by the user
  const item = db
    .select({
      item: tables.items,
      category: tables.categories,
    })
    .from(tables.items)
    .leftJoin(
      tables.categories,
      eq(tables.items.categorie, tables.categories.id),
    )
    .where(eq(tables.items.id, itemId))
    .get();

  if (!item || item.category?.user !== user.id) {
    throw createError({
      statusCode: 404,
      message: "Item not found",
    });
  }

  // Delete song mappings first
  await db.delete(tables.songsMap).where(eq(tables.songsMap.item, itemId));

  // Delete the item
  await db.delete(tables.items).where(eq(tables.items.id, itemId));

  return { success: true };
});
