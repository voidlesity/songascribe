export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const categoryId = parseInt(getRouterParam(event, "id") || "0");

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

  // Get all items in this category
  const items = await db
    .select()
    .from(tables.items)
    .where(eq(tables.items.categorie, categoryId));

  // Delete all song mappings for items in this category
  for (const item of items) {
    await db.delete(tables.songsMap).where(eq(tables.songsMap.item, item.id));
  }

  // Delete all items in this category
  await db.delete(tables.items).where(eq(tables.items.categorie, categoryId));

  // Delete any shares for this category
  await db.delete(tables.shares).where(eq(tables.shares.category, categoryId));

  // Delete the category
  await db
    .delete(tables.categories)
    .where(eq(tables.categories.id, categoryId));

  return { success: true };
});
