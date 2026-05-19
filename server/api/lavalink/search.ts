defineRouteMeta({
  openAPI: {
    tags: ["Lavalink"],
    summary: "Search tracks",
    description:
      "Search for tracks via Lavalink. Returns raw Lavalink search results.",
    parameters: [
      {
        in: "query",
        name: "q",
        required: true,
        schema: { type: "string" },
        description: "Search query",
      },
    ],
    responses: {
      200: {
        description: "Lavalink search results",
        content: { "application/json": { schema: { type: "object" } } },
      },
      400: { description: "Missing query parameter" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { q } = getQuery(event);

  if (!q || typeof q !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: 'Search query "q" is required',
    });
  }

  return await searchTracks(q);
});
