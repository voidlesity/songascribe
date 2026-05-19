defineRouteMeta({
  openAPI: {
    tags: ["User"],
    summary: "Update profile",
    description: "Update the name and avatar of the authenticated user.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["name", "avatar"],
            properties: {
              name: { type: "string" },
              avatar: { type: "string" },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Updated user profile",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                id: { type: "integer" },
                email: { type: "string" },
                name: { type: "string" },
                avatar: { type: "string", nullable: true },
                theme: { type: "string" },
              },
            },
          },
        },
      },
      400: { description: "Missing name or avatar" },
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

  const body = await readBody(event);

  if (!body.name || !body.avatar) {
    throw createError({
      statusCode: 400,
      statusMessage: "Name and avatar are required",
    });
  }

  const sessionUser = session.user as any;
  const updatedUser = await db
    .update(tables.users)
    .set({
      name: body.name,
      avatar: body.avatar,
    })
    .where(eq(tables.users.id, sessionUser.id))
    .returning();

  if (!updatedUser.length) {
    throw createError({
      statusCode: 404,
      statusMessage: "User not found",
    });
  }

  // Update the session with new user data
  await setUserSession(event, {
    user: updatedUser[0],
    tokens: session.tokens,
  });

  return updatedUser[0];
});
