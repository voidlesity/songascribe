defineRouteMeta({
  openAPI: {
    tags: ["Items"],
    summary: "Delete item",
    parameters: [
      {
        in: "path",
        name: "id",
        required: true,
        schema: { type: "integer", minimum: 1 },
      },
    ],
    responses: {
      204: { description: "Item deleted" },
      400: { description: "Invalid item id" },
      401: { description: "Unauthorized" },
      404: { description: "Item not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const id = parseRouteId(event, "item");
  requireOwnedItem(id, user.id);
  db.delete(tables.items).where(eq(tables.items.id, id)).run();
  return sendNoContent(event);
});
