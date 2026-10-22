defineRouteMeta({
  openAPI: {
    tags: ["Categories"],
    summary: "List own categories",
    description:
      "Returns all categories owned by the authenticated user, including ordered items and tracks.",
    responses: {
      200: { description: "List of category details" },
      401: { description: "Unauthorized" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const categories = db
    .select()
    .from(tables.categories)
    .where(eq(tables.categories.userId, user.id))
    .orderBy(asc(tables.categories.createdAt))
    .all();
  return categoriesWithItems(categories);
});
