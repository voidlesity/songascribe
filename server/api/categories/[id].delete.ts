defineRouteMeta({
  openAPI: {
    tags: ["Categories"],
    summary: "Delete category",
    description:
      "Deletes a category and all its items, item-track links and shares (cascade).",
    parameters: [
      { in: "path", name: "id", required: true, schema: { type: "integer" } },
    ],
    responses: {
      204: { description: "Deleted" },
      400: { description: "Invalid id" },
      401: { description: "Unauthorized" },
      404: { description: "Not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { user: sessionUser } = await requireUserSession(event);
  const id = Number(getRouterParam(event, "id"));
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid category id",
    });
  }

  const result = await db
    .delete(tables.categories)
    .where(
      and(
        eq(tables.categories.id, id),
        eq(tables.categories.userId, (sessionUser as { id: number }).id),
      ),
    )
    .returning({ id: tables.categories.id });

  if (result.length === 0) {
    throw createError({ statusCode: 404, statusMessage: "Category not found" });
  }

  setResponseStatus(event, 204);
  return null;
});
