defineRouteMeta({
  openAPI: {
    tags: ["Share"],
    summary: "Create share link for category",
    parameters: [
      { in: "path", name: "id", required: true, schema: { type: "integer" } },
    ],
    responses: {
      201: { description: "Share created or already exists" },
      400: { description: "Invalid id" },
      401: { description: "Unauthorized" },
      404: { description: "Category not found" },
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

  const existing = db
    .select()
    .from(tables.shares)
    .where(eq(tables.shares.categoryId, categoryId))
    .get();

  if (existing) {
    return {
      token: existing.token,
      url: `/share/${existing.token}`,
      createdAt: existing.createdAt,
      expiresAt: existing.expiresAt,
    };
  }

  const token = crypto.randomUUID();
  const [row] = await db
    .insert(tables.shares)
    .values({
      categoryId,
      token,
      createdAt: new Date(),
      expiresAt: null,
    })
    .returning();

  setResponseStatus(event, 201);
  return {
    token: row!.token,
    url: `/share/${row!.token}`,
    createdAt: row!.createdAt,
    expiresAt: row!.expiresAt,
  };
});
