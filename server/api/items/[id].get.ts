defineRouteMeta({
  openAPI: {
    tags: ["Items"],
    summary: "Get item",
    parameters: [
      {
        in: "path",
        name: "id",
        required: true,
        schema: { type: "integer", minimum: 1 },
      },
    ],
    responses: {
      200: { description: "Item with ordered tracks" },
      400: { description: "Invalid item id" },
      401: { description: "Unauthorized" },
      404: { description: "Item not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const id = parseRouteId(event, "item");
  return itemWithTracks(requireOwnedItem(id, user.id));
});
