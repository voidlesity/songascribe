defineRouteMeta({
  openAPI: {
    tags: ["Items"],
    summary: "Delete item",
    parameters: [
      { in: "path", name: "id", required: true, schema: { type: "integer" } },
    ],
    responses: {
      204: { description: "Deleted" },
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

  await getOwnedItem(id, (sessionUser as { id: number }).id);

  await db.delete(tables.items).where(eq(tables.items.id, id));

  setResponseStatus(event, 204);
  return null;
});
