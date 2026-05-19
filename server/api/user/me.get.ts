defineRouteMeta({
  openAPI: {
    tags: ["User"],
    summary: "Get current user",
    description:
      "Returns the full profile of the currently authenticated user.",
    responses: {
      200: {
        description: "User profile",
        content: {
          "application/json": {
            schema: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "integer" },
                  email: { type: "string" },
                  name: { type: "string" },
                  avatar: { type: "string", nullable: true },
                  theme: { type: "string" },
                  created_at: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
      },
      401: { description: "Unauthorized" },
      404: { description: "User not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const sessionUser = session.user as any;
  const user = await db
    .select()
    .from(tables.users)
    .where(eq(tables.users.id, sessionUser.id))
    .limit(1);

  if (!user.length) {
    throw createError({
      statusCode: 404,
      statusMessage: "User not found",
    });
  }

  return user;
});
