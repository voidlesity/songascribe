defineRouteMeta({
  openAPI: {
    tags: ["Categories"],
    summary: "Update category",
    parameters: [
      {
        in: "path",
        name: "id",
        required: true,
        schema: { type: "integer", minimum: 1 },
      },
    ],
    requestBody: {
      required: true,
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
      200: { description: "Updated category (without items)" },
      400: { description: "Invalid fields or empty patch" },
      401: { description: "Unauthorized" },
      404: { description: "Category not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const id = parseRouteId(event, "category");
  const body = await readObjectBody(event);
  const name = optionalString(body.name, "name", 500);
  const description = nullableString(body.description, "description");
  const isPublic = optionalBoolean(body.isPublic, "isPublic");
  if (
    name === undefined &&
    description === undefined &&
    isPublic === undefined
  ) {
    badRequest("No updatable fields provided");
  }

  requireOwnedCategory(id, user.id);
  const category = db
    .update(tables.categories)
    .set({ name, description, isPublic, updatedAt: new Date() })
    .where(eq(tables.categories.id, id))
    .returning()
    .get();
  return serializeCategory(category);
});
