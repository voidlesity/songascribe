import { NodeLinkError, searchTracks } from "../../utils/nodelink";
import { requiredString } from "../../utils/validation";

defineRouteMeta({
  openAPI: {
    tags: ["Audio"],
    summary: "Search tracks",
    description: "Searches NodeLink; HTTP(S) URLs load directly and text uses YouTube Music search. Results are capped at 100.",
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
      400: { description: "Invalid query" },
      502: { description: "NodeLink unavailable or invalid response" },
      504: { description: "NodeLink request timed out" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const query = requiredString(getQuery(event).q, "q", 500);
  try {
    return await searchTracks(query);
  } catch (error) {
    if (error instanceof NodeLinkError) {
      throw createError({
        statusCode: error.statusCode,
        statusMessage: error.message,
      });
    }
    throw createError({ statusCode: 502, statusMessage: "NodeLink is unavailable" });
  }
});
