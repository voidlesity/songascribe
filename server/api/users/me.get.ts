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
  const { user } = await requireUserSession(event);
  const row = db
    .select()
    .from(tables.users)
    .where(eq(tables.users.id, user.id))
    .get();
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: "User not found" });
  }
  return serializeUser(row);
});
