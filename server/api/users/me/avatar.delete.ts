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
  const { user } = await requireUserSession(event);
  const updated = db
    .update(tables.users)
    .set({
      avatar: null,
      avatarData: null,
      avatarMime: null,
      updatedAt: new Date(),
    })
    .where(eq(tables.users.id, user.id))
    .returning()
    .get();
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: "User not found" });
  }

  await setSessionUser(event, updated);
  return { avatar: null };
});
