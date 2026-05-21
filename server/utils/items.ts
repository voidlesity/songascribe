/**
 * Verify the item exists and belongs to the authenticated user. Returns the
 * joined item + category row, or throws.
 */
export async function getOwnedItem(
  itemId: number,
  userId: number,
): Promise<{ item: typeof tables.items.$inferSelect; categoryId: number }> {
  const row = db
    .select({ item: tables.items, category: tables.categories })
    .from(tables.items)
    .innerJoin(
      tables.categories,
      eq(tables.items.categoryId, tables.categories.id),
    )
    .where(
      and(eq(tables.items.id, itemId), eq(tables.categories.userId, userId)),
    )
    .get();

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: "Item not found" });
  }
  return { item: row.item, categoryId: row.category.id };
}
