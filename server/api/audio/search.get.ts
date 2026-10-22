defineRouteMeta({
  openAPI: {
    tags: ["Audio"],
    summary: "Search tracks",
    description:
      "Searches NodeLink. HTTP(S) URLs are loaded directly, anything else uses YouTube Music search. Results are capped at 100.",
    parameters: [
      {
        in: "query",
        name: "q",
        required: true,
        schema: { type: "string" },
        description: "Search query or HTTP(S) media URL",
      },
    ],
    responses: {
      200: { description: "Normalized track array" },
      400: { description: "Missing query" },
      502: { description: "NodeLink unavailable" },
      504: { description: "NodeLink request timed out" },
    },
  },
});

export default defineEventHandler((event) => {
  const query = requiredString(getQuery(event).q, "q", 500);
  return searchTracks(query);
});
