defineRouteMeta({
  openAPI: {
    tags: ["Audio"],
    summary: "Decode encoded track",
    parameters: [
      {
        in: "query",
        name: "encoded",
        required: true,
        schema: { type: "string" },
      },
    ],
    responses: {
      200: { description: "Normalized track" },
      400: { description: "Missing encoded track" },
      404: { description: "Track could not be decoded" },
      502: { description: "NodeLink unavailable" },
      504: { description: "NodeLink request timed out" },
    },
  },
});

export default defineEventHandler((event) => {
  const encoded = requiredString(getQuery(event).encoded, "encoded", 64 * 1024);
  return decodeTrack(encoded);
});
