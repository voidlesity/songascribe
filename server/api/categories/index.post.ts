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
