defineRouteMeta({
  openAPI: {
    tags: ["Share"],
    summary: "Revoke share link",
    parameters: [
      { in: "path", name: "id", required: true, schema: { type: "integer" } },
    ],
    responses: {
      204: { description: "Share revoked" },
      400: { description: "Invalid id" },
      401: { description: "Unauthorized" },
      404: { description: "No share found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { user: sessionUser } = await requireUserSession(event);
  const categoryId = Number(getRouterParam(event, "id"));
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid category id",
    });
  }

  const category = db
    .select()
    .from(tables.categories)
    .where(
      and(
        eq(tables.categories.id, categoryId),
        eq(tables.categories.userId, (sessionUser as { id: number }).id),
      ),
    )
    .get();
  if (!category) {
    throw createError({ statusCode: 404, statusMessage: "Category not found" });
  }

  const deleted = await db
    .delete(tables.shares)
    .where(eq(tables.shares.categoryId, categoryId))
    .returning({ id: tables.shares.id });

  if (deleted.length === 0) {
    throw createError({ statusCode: 404, statusMessage: "Share not found" });
  }

  setResponseStatus(event, 204);
  return null;
});
