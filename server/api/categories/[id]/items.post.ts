defineRouteMeta({
  openAPI: {
    tags: ["Items"],
    summary: "Create item in category",
    description:
      "Creates an item at the end of the category together with its ordered track list.",
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
            required: ["name"],
            properties: {
              name: { type: "string" },
              description: { type: "string", nullable: true },
              tracks: { type: "array", items: { type: "object" } },
            },
          },
        },
      },
    },
    responses: {
      201: { description: "Created item with tracks" },
      400: { description: "Invalid fields" },
      401: { description: "Unauthorized" },
      404: { description: "Category not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const categoryId = parseRouteId(event, "category");
  const body = await readObjectBody(event);
  const name = requiredString(body.name, "name", 500);
  const description = nullableString(body.description, "description") ?? null;
  const tracks = body.tracks === undefined ? [] : parseTrackList(body.tracks);
  requireOwnedCategory(categoryId, user.id);

  const item = db.transaction((tx) => {
    const last = tx
      .select({ position: sql<number | null>`max(${tables.items.position})` })
      .from(tables.items)
      .where(eq(tables.items.categoryId, categoryId))
      .get();
    const now = new Date();
    const item = tx
      .insert(tables.items)
      .values({
        categoryId,
        name,
        description,
        position: (last?.position ?? -1) + 1,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();
    setItemTracks(tx, item.id, tracks);
    return item;
  });

  setResponseStatus(event, 201);
  return itemWithTracks(item);
});
