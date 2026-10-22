defineRouteMeta({
  openAPI: {
    tags: ["Items"],
    summary: "Reorder category items",
    description:
      "Replaces item positions. Every item id of the category must appear exactly once.",
    parameters: [
      {
        in: "path",
        name: "id",
        required: true,
        schema: { type: "integer", minimum: 1 },
      },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["itemIds"],
            properties: {
              itemIds: {
                type: "array",
                items: { type: "integer", minimum: 1 },
              },
            },
          },
        },
      },
    },
    responses: {
      204: { description: "Items reordered" },
      400: { description: "Invalid or incomplete item id list" },
      401: { description: "Unauthorized" },
      404: { description: "Category not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const categoryId = parseRouteId(event, "category");
  const body = await readObjectBody(event);
  const itemIds = parseIdList(body.itemIds, "itemIds", 10_000);
  requireOwnedCategory(categoryId, user.id);

  db.transaction((tx) => {
    const existing = tx
      .select({ id: tables.items.id })
      .from(tables.items)
      .where(eq(tables.items.categoryId, categoryId))
      .all()
      .map((item) => item.id);
    if (
      itemIds.length !== existing.length ||
      existing.some((id) => !itemIds.includes(id))
    ) {
      badRequest(
        "itemIds must contain every item of the category exactly once",
      );
    }

    const now = new Date();
    itemIds.forEach((id, position) => {
      tx.update(tables.items)
        .set({ position, updatedAt: now })
        .where(eq(tables.items.id, id))
        .run();
    });
  });

  return sendNoContent(event);
});
