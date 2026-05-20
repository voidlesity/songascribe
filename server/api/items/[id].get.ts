defineRouteMeta({
  openAPI: {
    tags: ["Items"],
    summary: "Get item",
    parameters: [
      { in: "path", name: "id", required: true, schema: { type: "integer" } },
    ],
    responses: {
      200: { description: "Item with tracks" },
      400: { description: "Invalid id" },
      401: { description: "Unauthorized" },
      404: { description: "Item not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { user: sessionUser } = await requireUserSession(event);
  const id = Number(getRouterParam(event, "id"));
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: "Invalid item id" });
  }

  const { item } = await getOwnedItem(id, (sessionUser as { id: number }).id);

  return {
    id: item.id,
    categoryId: item.categoryId,
    name: item.name,
    description: item.description,
    position: item.position,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    tracks: await getItemTracks(item.id),
  };
});
