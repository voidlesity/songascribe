defineRouteMeta({
  openAPI: {
    tags: ["User"],
    summary: "Update theme",
    description: "Update the UI theme preference of the authenticated user.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["theme"],
            properties: {
              theme: {
                type: "string",
                description: "Theme name (e.g. dark, light)",
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Updated user",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                id: { type: "integer" },
                email: { type: "string" },
                name: { type: "string" },
                theme: { type: "string" },
              },
            },
          },
        },
      },
      400: { description: "Missing theme" },
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

  if (!body.theme) {
    throw createError({
      statusCode: 400,
      statusMessage: "Theme is required",
    });
  }

  const sessionUser = session.user as any;
  const updatedUser = await db
    .update(tables.users)
    .set({
      theme: body.theme,
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
