defineRouteMeta({
  openAPI: {
    tags: ["Users"],
    summary: "Update current user",
    description: "Partially updates the authenticated user's profile.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: { theme: { type: "string" } },
          },
        },
      },
    },
    responses: {
      200: { description: "Updated user" },
      400: { description: "Invalid or empty patch" },
      401: { description: "Unauthorized" },
      404: { description: "User not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const body = await readObjectBody(event);
  const theme = optionalString(body.theme, "theme", 100);
  if (theme === undefined) badRequest("No updatable fields provided");

  const updated = db
    .update(tables.users)
    .set({ theme, updatedAt: new Date() })
    .where(eq(tables.users.id, user.id))
    .returning()
    .get();
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: "User not found" });
  }

  await setSessionUser(event, updated);
  return serializeUser(updated);
});
