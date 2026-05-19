defineRouteMeta({
  openAPI: {
    tags: ["Lavalink"],
    summary: "Decode track",
    description:
      "Decode a Lavalink encoded track ID and return its track info object.",
    parameters: [
      {
        in: "query",
        name: "trackId",
        required: true,
        schema: { type: "string" },
        description: "Base64-encoded Lavalink track ID",
      },
    ],
    responses: {
      200: {
        description: "Decoded track info",
        content: { "application/json": { schema: { type: "object" } } },
      },
      400: { description: "Missing trackId" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { trackId } = getQuery(event);

  if (!trackId || typeof trackId !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: 'Encoded track ID "trackId" is required',
    });
  }

  return await decodeTrack(trackId);
});
