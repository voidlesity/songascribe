defineRouteMeta({
  openAPI: {
    tags: ["Library"],
    summary: "Export library as JSON",
    description:
      "Exports all categories of the authenticated user with their ordered items, tracks and reasons in a versioned format.",
    responses: {
      200: {
        description: "Versioned library export",
        content: { "application/json": {} },
      },
      401: { description: "Unauthorized" },
    },
  },
});

export default defineEventHandler(async (event): Promise<LibraryExport> => {
  const { user } = await requireUserSession(event);
  const categories = db
    .select()
    .from(tables.categories)
    .where(eq(tables.categories.userId, user.id))
    .orderBy(asc(tables.categories.createdAt))
    .all();

  const exportedAt = new Date().toISOString();
  setResponseHeader(
    event,
    "Content-Disposition",
    `attachment; filename="songascribe-library-${exportedAt.slice(0, 10)}.json"`,
  );
  return {
    version: 1,
    exportedAt,
    categories: categoriesWithItems(categories).map((category) => ({
      name: category.name,
      description: category.description,
      isPublic: category.isPublic,
      items: category.items.map((item) => ({
        name: item.name,
        description: item.description,
        position: item.position,
        tracks: item.tracks.map(({ id: _id, ...track }) => track),
      })),
    })),
  };
});
