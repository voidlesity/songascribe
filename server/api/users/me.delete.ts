defineRouteMeta({
  openAPI: {
    tags: ["Users"],
    summary: "Delete current user",
    description:
      "Permanently deletes the authenticated user's account and all associated data.",
    responses: {
      204: { description: "Account deleted" },
      401: { description: "Unauthorized" },
      404: { description: "User not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const deleted = db
    .delete(tables.users)
    .where(eq(tables.users.id, user.id))
    .returning({ id: tables.users.id })
    .get();
  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: "User not found" });
  }

  await clearUserSession(event);
  return sendNoContent(event);
});
