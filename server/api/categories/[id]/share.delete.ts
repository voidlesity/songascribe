defineRouteMeta({
  openAPI: {
    tags: ["Share"],
    summary: "Revoke category share",
    parameters: [
      {
        in: "path",
        name: "id",
        required: true,
        schema: { type: "integer", minimum: 1 },
      },
    ],
    responses: {
      204: { description: "Share revoked" },
      400: { description: "Invalid category id" },
      401: { description: "Unauthorized" },
      404: { description: "Category or share not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const categoryId = parseRouteId(event, "category");
  requireOwnedCategory(categoryId, user.id);

  const deleted = db
    .delete(tables.shares)
    .where(eq(tables.shares.categoryId, categoryId))
    .returning({ id: tables.shares.id })
    .get();
  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: "Share not found" });
  }
  return sendNoContent(event);
});
