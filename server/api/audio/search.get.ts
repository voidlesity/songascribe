defineRouteMeta({
  openAPI: {
    tags: ["Audio"],
    summary: "Search tracks",
    description:
      "Search NodeLink for tracks. URLs are loaded directly, plain text uses YouTube Music search.",
    parameters: [
      {
        in: "query",
        name: "q",
        required: true,
        schema: { type: "string" },
        description: "Search query or media URL",
      },
    ],
    responses: {
      200: { description: "Array of normalized tracks" },
      400: { description: "Missing query" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { q } = getQuery(event);

  if (typeof q !== "string" || !q.trim()) {
    throw createError({ statusCode: 400, statusMessage: "q is required" });
  }

  return await searchTracks(q.trim());
});
