defineRouteMeta({
  openAPI: {
    tags: ["Items"],
    summary: "Create item",
    description:
      "Create a new item (playlist entry) inside one of the authenticated user's categories. Optionally attach Lavalink tracks.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["name", "categoryId"],
            properties: {
              name: { type: "string" },
              categoryId: { type: "integer" },
              songs: {
                type: "array",
                description: "Lavalink track objects",
                items: {
                  type: "object",
                  required: ["encoded"],
                  properties: {
                    encoded: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Created item",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                id: { type: "integer" },
                name: { type: "string" },
                categorie: { type: "integer" },
              },
            },
          },
        },
      },
      400: { description: "Missing required fields" },
      401: { description: "Unauthorized" },
      404: { description: "Category not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const body = await readBody(event);

  if (!body.name || !body.categoryId) {
    throw createError({
      statusCode: 400,
      message: "Item name and category ID are required",
    });
  }

  // Verify the category belongs to the user
  const category = db
    .select()
    .from(tables.categories)
    .where(
      and(
        eq(tables.categories.id, body.categoryId),
        eq(tables.categories.user, user.id),
      ),
    )
    .get();

  if (!category) {
    throw createError({
      statusCode: 404,
      message: "Category not found",
    });
  }

  // Create the item
  const [newItem] = await db
    .insert(tables.items)
    .values({
      categorie: body.categoryId,
      name: body.name,
    })
    .returning();

  // Add songs if provided — store the raw Lavalink track object as JSON
  if (body.songs && Array.isArray(body.songs)) {
    for (const track of body.songs) {
      if (!track.encoded) continue;

      await db.insert(tables.songsMap).values({
        item: newItem?.id,
        song: JSON.stringify(track),
      });
    }
  }

  return newItem;
});
