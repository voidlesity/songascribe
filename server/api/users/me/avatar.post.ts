defineRouteMeta({
  openAPI: {
    tags: ["Users"],
    summary: "Upload current user's avatar",
    description:
      "Accepts a multipart image upload, validates it is a real image, stores it and returns the avatar URL.",
    requestBody: {
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              file: { type: "string", format: "binary" },
            },
            required: ["file"],
          },
        },
      },
    },
    responses: {
      200: { description: "Avatar updated" },
      400: { description: "Invalid or missing image" },
      401: { description: "Unauthorized" },
      413: { description: "Image too large" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { user: sessionUser } = await requireUserSession(event);
  const userId = (sessionUser as { id: number }).id;

  const parts = await readMultipartFormData(event);
  const part = parts?.find((p) => p.name === "file" && p.filename);

  if (!part || !part.data?.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "No image file provided",
    });
  }

  if (part.data.length > AVATAR_MAX_BYTES) {
    throw createError({
      statusCode: 413,
      statusMessage: "Image exceeds the 2 MB limit",
    });
  }

  const kind = detectImage(part.data);
  if (!kind) {
    throw createError({
      statusCode: 400,
      statusMessage: "File is not a valid image",
    });
  }

  const [updated] = await db
    .update(tables.users)
    .set({
      avatar: avatarUrl(userId),
      avatarData: part.data,
      avatarMime: kind.mime,
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

  return { avatar: updated.avatar };
});
