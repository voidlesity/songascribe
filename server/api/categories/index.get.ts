defineRouteMeta({
  openAPI: {
    tags: ["Categories"],
    summary: "List own categories",
    description:
      "Returns all categories owned by the authenticated user, including items and tracks (ordered).",
    responses: {
      200: { description: "List of categories" },
      401: { description: "Unauthorized" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { user: sessionUser } = await requireUserSession(event);
  const userId = (sessionUser as { id: number }).id;

  const cats = await db
    .select()
    .from(tables.categories)
    .where(eq(tables.categories.userId, userId))
    .orderBy(asc(tables.categories.createdAt));

  return Promise.all(
    cats.map(async (c) => {
      const its = await db
        .select()
        .from(tables.items)
        .where(eq(tables.items.categoryId, c.id))
        .orderBy(asc(tables.items.position), asc(tables.items.id));

      const itemsOut = await Promise.all(
        its.map(async (i) => ({
          id: i.id,
          name: i.name,
          description: i.description,
          position: i.position,
          createdAt: i.createdAt,
          updatedAt: i.updatedAt,
          tracks: await getItemTracks(i.id),
        })),
      );

      return {
        id: c.id,
        name: c.name,
        description: c.description,
        isPublic: c.isPublic,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        items: itemsOut,
      };
    }),
  );
});
