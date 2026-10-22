defineRouteMeta({
  openAPI: {
    tags: ["Categories"],
    summary: "Create category",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["name"],
            properties: {
              name: { type: "string" },
              description: { type: "string", nullable: true },
              isPublic: { type: "boolean", default: false },
            },
          },
        },
      },
    },
    responses: {
      201: { description: "Created category (without items)" },
      400: { description: "Invalid fields" },
      401: { description: "Unauthorized" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const body = await readObjectBody(event);
  const now = new Date();
  const category = db
    .insert(tables.categories)
    .values({
      userId: user.id,
      name: requiredString(body.name, "name", 500),
      description: nullableString(body.description, "description") ?? null,
      isPublic: optionalBoolean(body.isPublic, "isPublic") ?? false,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  setResponseStatus(event, 201);
  return serializeCategory(category);
});
