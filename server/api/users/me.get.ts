defineRouteMeta({
  openAPI: {
    tags: ["Users"],
    summary: "Get current user",
    description: "Returns the profile of the authenticated user.",
    responses: {
      200: { description: "User profile" },
      401: { description: "Unauthorized" },
      404: { description: "User not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { user: sessionUser } = await requireUserSession(event);

  const user = db
    .select()
    .from(tables.users)
    .where(eq(tables.users.id, (sessionUser as { id: number }).id))
    .get();

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "User not found" });
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    theme: user.theme,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
});
