import { NodeLinkError, decodeTrack } from "../../utils/nodelink";
import { requiredString } from "../../utils/validation";

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
      400: { description: "Invalid encoded track" },
      404: { description: "Track could not be decoded" },
      502: { description: "NodeLink unavailable or invalid response" },
      504: { description: "NodeLink request timed out" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const encoded = requiredString(getQuery(event).encoded, "encoded", 64 * 1024);
  try {
    const track = await decodeTrack(encoded);
    if (!track) {
      throw createError({ statusCode: 404, statusMessage: "Track not found" });
    }
    return track;
  } catch (error) {
    if (error instanceof NodeLinkError) {
      throw createError({ statusCode: error.statusCode, statusMessage: error.message });
    }
    throw error;
  }
});
