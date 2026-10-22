defineRouteMeta({
  openAPI: {
    tags: ["Categories"],
    summary: "Delete category",
    description:
      "Deletes a category together with its items, track links and share.",
    parameters: [
      {
        in: "path",
        name: "id",
        required: true,
        schema: { type: "integer", minimum: 1 },
      },
    ],
    responses: {
      204: { description: "Category deleted" },
      400: { description: "Invalid category id" },
      401: { description: "Unauthorized" },
      404: { description: "Category not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const id = parseRouteId(event, "category");
  requireOwnedCategory(id, user.id);
  db.delete(tables.categories).where(eq(tables.categories.id, id)).run();
  return sendNoContent(event);
});
