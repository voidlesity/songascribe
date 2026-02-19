export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const itemId = parseInt(getRouterParam(event, "id") || "0");
  const body = await readBody(event);

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

  // Update the item name if provided
  if (body.name) {
    await db
      .update(tables.items)
      .set({ name: body.name })
      .where(eq(tables.items.id, itemId));
  }

  // Update songs if provided — store the raw Lavalink track object as JSON
  if (body.songs && Array.isArray(body.songs)) {
    // Remove existing song mappings
    await db.delete(tables.songsMap).where(eq(tables.songsMap.item, itemId));

    // Re-add songs
    for (const track of body.songs) {
      if (!track.encoded) continue;

      await db.insert(tables.songsMap).values({
        item: itemId,
        song: JSON.stringify(track),
      });
    }
  }

  return { success: true };
});
