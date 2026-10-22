defineRouteMeta({
  openAPI: {
    tags: ["Items"],
    summary: "Reorder item tracks",
    description:
      "Replaces track positions. The ids must match the item's current tracks exactly; a track that appears twice must be listed twice.",
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
            required: ["trackIds"],
            properties: {
              trackIds: {
                type: "array",
                items: { type: "integer", minimum: 1 },
              },
            },
          },
        },
      },
    },
    responses: {
      204: { description: "Tracks reordered" },
      400: { description: "Invalid or non-matching track id list" },
      401: { description: "Unauthorized" },
      404: { description: "Item not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const itemId = parseRouteId(event, "item");
  const body = await readObjectBody(event);
  const trackIds = parseIdList(body.trackIds, "trackIds");
  requireOwnedItem(itemId, user.id);

  db.transaction((tx) => {
    const links = tx
      .select({ id: tables.itemTracks.id, trackId: tables.itemTracks.trackId })
      .from(tables.itemTracks)
      .where(eq(tables.itemTracks.itemId, itemId))
      .orderBy(asc(tables.itemTracks.position), asc(tables.itemTracks.id))
      .all();

    // Map each requested track id to one of its links, so duplicates work.
    const ordered = trackIds.map((trackId) => {
      const index = links.findIndex((link) => link.trackId === trackId);
      if (index === -1) {
        badRequest("trackIds must match the item's tracks exactly");
      }
      return links.splice(index, 1)[0]!;
    });
    if (links.length > 0) {
      badRequest("trackIds must match the item's tracks exactly");
    }

    ordered.forEach((link, position) => {
      tx.update(tables.itemTracks)
        .set({ position })
        .where(eq(tables.itemTracks.id, link.id))
        .run();
    });
    tx.update(tables.items)
      .set({ updatedAt: new Date() })
      .where(eq(tables.items.id, itemId))
      .run();
  });

  return sendNoContent(event);
});
