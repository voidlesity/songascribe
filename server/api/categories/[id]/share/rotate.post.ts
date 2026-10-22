defineRouteMeta({
  openAPI: {
    tags: ["Share"],
    summary: "Rotate category share token",
    description:
      "Invalidates the current share link and returns a new one. The expiry is kept unless expiresAt is passed.",
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
      200: { description: "Rotated share" },
      400: { description: "Invalid category id or expiry" },
      401: { description: "Unauthorized" },
      404: { description: "Category or share not found" },
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

  const share = db
    .update(tables.shares)
    .set({ token: crypto.randomUUID(), expiresAt })
    .where(eq(tables.shares.categoryId, categoryId))
    .returning()
    .get();
  if (!share) {
    throw createError({ statusCode: 404, statusMessage: "Share not found" });
  }
  return serializeShare(share);
});
