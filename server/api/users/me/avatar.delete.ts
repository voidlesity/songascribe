defineRouteMeta({
  openAPI: {
    tags: ["Users"],
    summary: "Remove current user's avatar",
    responses: {
      200: { description: "Avatar removed" },
      401: { description: "Unauthorized" },
      404: { description: "User not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { user: sessionUser } = await requireUserSession(event);
  const userId = (sessionUser as { id: number }).id;

  const [updated] = await db
    .update(tables.users)
    .set({
      avatar: null,
      avatarData: null,
      avatarMime: null,
      updatedAt: new Date(),
    })
    .where(eq(tables.users.id, userId))
    .returning();

  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: "User not found" });
  }

  await setUserSession(event, {
    user: {
      id: updated.id,
      username: updated.username,
      avatar: updated.avatar,
      theme: updated.theme,
    },
  });

  return { avatar: null };
});
