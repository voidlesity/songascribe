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
      400: { description: "Missing encoded" },
      404: { description: "Could not decode" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { encoded } = getQuery(event);

  if (typeof encoded !== "string" || !encoded) {
    throw createError({
      statusCode: 400,
      statusMessage: "encoded is required",
    });
  }

  const track = await decodeTrack(encoded);
  if (!track) {
    throw createError({ statusCode: 404, statusMessage: "Track not found" });
  }
  return track;
});
