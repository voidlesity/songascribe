defineRouteMeta({
  openAPI: {
    tags: ["Users"],
    summary: "Get a user's avatar image",
    description:
      "Serves a user's avatar image, stored in the database, by user id.",
    responses: {
      200: { description: "Avatar image" },
      404: { description: "Avatar not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 404, statusMessage: "Avatar not found" });
  }

  const row = db
    .select({
      data: tables.users.avatarData,
      mime: tables.users.avatarMime,
    })
    .from(tables.users)
    .where(eq(tables.users.id, id))
    .get();

  if (!row?.data || !row.mime) {
    throw createError({ statusCode: 404, statusMessage: "Avatar not found" });
  }

  setResponseHeaders(event, {
    "Content-Type": row.mime,
    // Immutable because the URL carries a `?v=` cache-busting version.
    "Cache-Control": "public, max-age=31536000, immutable",
  });

  return row.data;
});
