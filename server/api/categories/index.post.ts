defineRouteMeta({
  openAPI: {
    tags: ["Categories"],
    summary: "Create category",
    description: "Create a new category for the authenticated user.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["name"],
            properties: {
              name: { type: "string" },
              isPublic: { type: "boolean", default: false },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Created category",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                id: { type: "integer" },
                name: { type: "string" },
                is_public: { type: "boolean" },
                created_at: { type: "string", format: "date-time" },
              },
            },
          },
        },
      },
      400: { description: "Missing category name" },
      401: { description: "Unauthorized" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const body = await readBody(event);

  if (!body.name) {
    throw createError({
      statusCode: 400,
      message: "Category name is required",
    });
  }

  const [newCategory] = await db
    .insert(tables.categories)
    .values({
      user: user.id,
      name: body.name,
      is_public: body.isPublic || false,
      created_at: new Date(),
    })
    .returning();

  return newCategory;
});
