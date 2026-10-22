defineRouteMeta({
  openAPI: {
    tags: ["Items"],
    summary: "Update item",
    description:
      "Partially updates an item. Passing tracks replaces the whole track list in the given order.",
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
            properties: {
              name: { type: "string" },
              description: { type: "string", nullable: true },
              position: { type: "integer", minimum: 0 },
              tracks: { type: "array", items: { type: "object" } },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Updated item with tracks" },
      400: { description: "Invalid fields or empty patch" },
      401: { description: "Unauthorized" },
      404: { description: "Item not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const id = parseRouteId(event, "item");
  const body = await readObjectBody(event);
  const name = optionalString(body.name, "name", 500);
  const description = nullableString(body.description, "description");
  const position =
    body.position === undefined
      ? undefined
      : parseInteger(body.position, "position");
  const tracks =
    body.tracks === undefined ? undefined : parseTrackList(body.tracks);
  if ([name, description, position, tracks].every((v) => v === undefined)) {
    badRequest("No updatable fields provided");
  }
  requireOwnedItem(id, user.id);

  const item = db.transaction((tx) => {
    if (tracks) setItemTracks(tx, id, tracks);
    return tx
      .update(tables.items)
      .set({ name, description, position, updatedAt: new Date() })
      .where(eq(tables.items.id, id))
      .returning()
      .get();
  });
  return itemWithTracks(item);
});
