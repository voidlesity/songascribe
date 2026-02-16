export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const itemId = parseInt(getRouterParam(event, "id") || "0");

  if (!itemId) {
    throw createError({
      statusCode: 400,
      message: "Invalid item ID",
    });
  }

  // Get the item and verify it belongs to a category owned by the user
  const item = db
    .select({
      item: tables.items,
      category: tables.categories,
    })
    .from(tables.items)
    .leftJoin(
      tables.categories,
      eq(tables.items.categorie, tables.categories.id),
    )
    .where(eq(tables.items.id, itemId))
    .get();

  if (!item || item.category?.user !== user.id) {
    throw createError({
      statusCode: 404,
      message: "Item not found",
    });
  }

  // Delete song mappings first
  await db.delete(tables.songsMap).where(eq(tables.songsMap.item, itemId));

  // Delete the item
  await db.delete(tables.items).where(eq(tables.items.id, itemId));

  return { success: true };
});
