export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const body = await readBody(event);

  if (!body.name || !body.categoryId) {
    throw createError({
      statusCode: 400,
      message: "Item name and category ID are required",
    });
  }

  // Verify the category belongs to the user
  const category = db
    .select()
    .from(tables.categories)
    .where(
      and(
        eq(tables.categories.id, body.categoryId),
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

  // Create the item
  const [newItem] = await db
    .insert(tables.items)
    .values({
      categorie: body.categoryId,
      name: body.name,
    })
    .returning();

  // Add songs if provided — store the raw Lavalink track object as JSON
  if (body.songs && Array.isArray(body.songs)) {
    for (const track of body.songs) {
      if (!track.encoded) continue;

      await db.insert(tables.songsMap).values({
        item: newItem?.id,
        song: JSON.stringify(track),
      });
    }
  }

  return newItem;
});
