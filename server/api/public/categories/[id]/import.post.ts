defineRouteMeta({
  openAPI: {
    tags: ["Public", "Categories"],
    summary: "Import public category",
    description:
      "Copies a public category with its ordered items, tracks and reasons into the authenticated user's library as a private category.",
    parameters: [
      {
        in: "path",
        name: "id",
        required: true,
        schema: { type: "integer", minimum: 1 },
      },
    ],
    responses: {
      201: { description: "Imported private category" },
      400: { description: "Invalid category id" },
      401: { description: "Unauthorized" },
      404: { description: "Public category not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const sourceId = parseRouteId(event, "category");
  const source = db
    .select()
    .from(tables.categories)
    .where(
      and(
        eq(tables.categories.id, sourceId),
        eq(tables.categories.isPublic, true),
      ),
    )
    .get();
  if (!source) {
    throw createError({ statusCode: 404, statusMessage: "Category not found" });
  }

  const category = db.transaction((tx) => {
    const now = new Date();
    const category = tx
      .insert(tables.categories)
      .values({
        userId: user.id,
        name: source.name,
        description: source.description,
        isPublic: false,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();

    const items = tx
      .select()
      .from(tables.items)
      .where(eq(tables.items.categoryId, sourceId))
      .all();
    for (const item of items) {
      const { id: itemId } = tx
        .insert(tables.items)
        .values({
          categoryId: category.id,
          name: item.name,
          description: item.description,
          position: item.position,
          createdAt: now,
          updatedAt: now,
        })
        .returning({ id: tables.items.id })
        .get();

      const links = tx
        .select()
        .from(tables.itemTracks)
        .where(eq(tables.itemTracks.itemId, item.id))
        .all();
      if (links.length > 0) {
        tx.insert(tables.itemTracks)
          .values(
            links.map((link) => ({
              itemId,
              trackId: link.trackId,
              position: link.position,
              reason: link.reason,
              addedAt: now,
            })),
          )
          .run();
      }
    }
    return category;
  });

  setResponseStatus(event, 201);
  return categoryWithItems(category);
});
