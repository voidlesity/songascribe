defineRouteMeta({
  openAPI: {
    tags: ["Users"],
    summary: "Update current user",
    description: "Partially update the authenticated user's profile.",
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              avatar: { type: "string", nullable: true },
              theme: { type: "string" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Updated user" },
      400: { description: "Empty patch" },
      401: { description: "Unauthorized" },
      404: { description: "User not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { user: sessionUser } = await requireUserSession(event);
  const body = ((await readBody<{
    avatar?: string | null;
    theme?: string;
  }>(event)) ?? {}) as {
    avatar?: string | null;
    theme?: string;
  };

  const patch: Record<string, unknown> = {};
  if (body.avatar !== undefined) patch.avatar = body.avatar;
  if (typeof body.theme === "string" && body.theme.trim())
    patch.theme = body.theme.trim();

  if (Object.keys(patch).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "No updatable fields provided",
    });
  }
  patch.updatedAt = new Date();

  const [updated] = await db
    .update(tables.users)
    .set(patch)
    .where(eq(tables.users.id, (sessionUser as { id: number }).id))
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

  return {
    id: updated.id,
    email: updated.email,
    username: updated.username,
    avatar: updated.avatar,
    theme: updated.theme,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
});
