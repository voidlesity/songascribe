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
  const { user } = await requireUserSession(event);
  const file = (await readMultipartFormData(event))?.find(
    (part) => part.name === "file" && part.filename,
  );
  if (!file?.data.length) badRequest("No image file provided");
  if (file.data.length > AVATAR_MAX_BYTES) {
    throw createError({
      statusCode: 413,
      statusMessage: "Image exceeds the 2 MB limit",
    });
  }
  const kind = detectImage(file.data);
  if (!kind) badRequest("File is not a valid image");

  const updated = db
    .update(tables.users)
    .set({
      avatar: avatarUrl(user.id),
      avatarData: file.data,
      avatarMime: kind.mime,
      updatedAt: new Date(),
    })
    .where(eq(tables.users.id, user.id))
    .returning()
    .get();
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: "User not found" });
  }

  await setSessionUser(event, updated);
  return { avatar: updated.avatar };
});
