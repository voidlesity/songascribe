defineRouteMeta({
  openAPI: {
    tags: ["Categories"],
    summary: "Update category",
    parameters: [
      { in: "path", name: "id", required: true, schema: { type: "integer" } },
    ],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string", nullable: true },
              isPublic: { type: "boolean" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Updated category" },
      400: { description: "Invalid id or empty patch" },
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

  const existing = db
    .select()
    .from(tables.categories)
    .where(
      and(
        eq(tables.categories.id, id),
        eq(tables.categories.userId, (sessionUser as { id: number }).id),
      ),
    )
    .get();
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: "Category not found" });
  }

  const body = ((await readBody<{
    name?: string;
    description?: string | null;
    isPublic?: boolean;
  }>(event)) ?? {}) as {
    name?: string;
    description?: string | null;
    isPublic?: boolean;
  };

  const patch: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim())
    patch.name = body.name.trim();
  if (body.description !== undefined) patch.description = body.description;
  if (typeof body.isPublic === "boolean") patch.isPublic = body.isPublic;

  if (Object.keys(patch).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "No updatable fields provided",
    });
  }
  patch.updatedAt = new Date();

  const [row] = await db
    .update(tables.categories)
    .set(patch)
    .where(eq(tables.categories.id, id))
    .returning();

  return {
    id: row!.id,
    name: row!.name,
    description: row!.description,
    isPublic: row!.isPublic,
    createdAt: row!.createdAt,
    updatedAt: row!.updatedAt,
  };
});
