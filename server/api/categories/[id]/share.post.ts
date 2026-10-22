defineRouteMeta({
  openAPI: {
    tags: ["Share"],
    summary: "Create or get category share",
    description:
      "Creates a share link if there is none yet. Passing expiresAt updates the expiry of an existing share without changing its token.",
    parameters: [
      {
        in: "path",
        name: "id",
        required: true,
        schema: { type: "integer", minimum: 1 },
      },
    ],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              expiresAt: {
                type: "string",
                format: "date-time",
                nullable: true,
              },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Existing share" },
      201: { description: "Share created" },
      400: { description: "Invalid category id or expiry" },
      401: { description: "Unauthorized" },
      404: { description: "Category not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const categoryId = parseRouteId(event, "category");
  const expiresAt = parseOptionalExpiry(
    (await readObjectBody(event)).expiresAt,
  );
  requireOwnedCategory(categoryId, user.id);

  const existing = db
    .select()
    .from(tables.shares)
    .where(eq(tables.shares.categoryId, categoryId))
    .get();

  if (!existing) {
    const share = db
      .insert(tables.shares)
      .values({
        categoryId,
        token: crypto.randomUUID(),
        createdAt: new Date(),
        expiresAt: expiresAt ?? null,
      })
      .returning()
      .get();
    setResponseStatus(event, 201);
    return serializeShare(share);
  }

  if (expiresAt === undefined) return serializeShare(existing);
  const share = db
    .update(tables.shares)
    .set({ expiresAt })
    .where(eq(tables.shares.id, existing.id))
    .returning()
    .get();
  return serializeShare(share);
});
