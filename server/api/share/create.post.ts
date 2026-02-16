export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const body = await readBody(event);

  if (!body.categoryId) {
    throw createError({
      statusCode: 400,
      message: "Category ID is required",
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

  // Check if a share already exists for this category
  const existingShare = db
    .select()
    .from(tables.shares)
    .where(eq(tables.shares.category, body.categoryId))
    .get();

  if (existingShare) {
    return {
      shareToken: existingShare.share_token,
      shareUrl: `/share/${existingShare.share_token}`,
    };
  }

  // Generate a unique share token
  const shareToken = crypto.randomUUID();

  // Create the share
  const [newShare] = await db
    .insert(tables.shares)
    .values({
      category: body.categoryId,
      share_token: shareToken,
      created_at: new Date(),
    })
    .returning();

  return {
    shareToken: newShare?.share_token,
    shareUrl: `/share/${newShare?.share_token}`,
  };
});
