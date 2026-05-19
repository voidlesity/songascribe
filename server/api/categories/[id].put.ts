defineRouteMeta({
  openAPI: {
    tags: ["Categories"],
    summary: "Update category",
    description:
      "Update the name or visibility of a category owned by the authenticated user.",
    parameters: [
      {
        in: "path",
        name: "id",
        required: true,
        schema: { type: "integer" },
        description: "Category ID",
      },
    ],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              isPublic: { type: "boolean" },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Update result",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: { success: { type: "boolean" } },
            },
          },
        },
      },
      400: { description: "Invalid category ID" },
      401: { description: "Unauthorized" },
      404: { description: "Category not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const categoryId = parseInt(getRouterParam(event, "id") || "0");
  const body = await readBody(event);

  if (!categoryId) {
    throw createError({
      statusCode: 400,
      message: "Invalid category ID",
    });
  }

  // Verify the category belongs to the user
  const category = db
    .select()
    .from(tables.categories)
    .where(
      and(
        eq(tables.categories.id, categoryId),
        eq(tables.categories.user, user.id),
      ),
    )
    .get();

  if (!category) {
    throw createError({
      statusCode: 404,
      message: "Category not found",
    });
  }

  // Update the category
  const updateData: any = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.isPublic !== undefined) updateData.is_public = body.isPublic;

  await db
    .update(tables.categories)
    .set(updateData)
    .where(eq(tables.categories.id, categoryId));

  return { success: true };
});
