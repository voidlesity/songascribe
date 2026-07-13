import { reorderItemTracks } from "../../../../services/catalog/commands";
import {
  asObject,
  badRequest,
  parseInteger,
  parsePositiveId,
  requireSessionUserId,
} from "../../../../utils/validation";

defineRouteMeta({
  openAPI: {
    tags: ["Items"],
    summary: "Reorder item tracks",
    description:
      "Atomically replaces track-link positions. Track ids must match the current list; duplicate track ids are supported.",
    parameters: [
      { in: "path", name: "id", required: true, schema: { type: "integer", minimum: 1 } },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["trackIds"],
            properties: {
              trackIds: {
                type: "array",
                items: { type: "integer", minimum: 1 },
              },
            },
          },
        },
      },
    },
    responses: {
      204: { description: "Tracks reordered" },
      400: { description: "Invalid or non-matching track id list" },
      401: { description: "Unauthorized" },
      404: { description: "Item not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const userId = await requireSessionUserId(event);
  const itemId = parsePositiveId(event, "id", "item id");
  const body = asObject((await readBody(event)) ?? {});
  if (!Array.isArray(body.trackIds)) badRequest("trackIds must be an array");
  if (body.trackIds.length > 1_000) {
    badRequest("trackIds cannot contain more than 1000 ids");
  }
  const trackIds = body.trackIds.map((id, index) =>
    parseInteger(id, `trackIds[${index}]`, {
      min: 1,
      max: Number.MAX_SAFE_INTEGER,
    }),
  );
  reorderItemTracks(itemId, userId, trackIds);
  setResponseStatus(event, 204);
  return null;
});
