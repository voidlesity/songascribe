import { createItemWithTracks } from "../../../services/catalog/commands";
import { getItemWithTracks } from "../../../services/catalog/queries";
import {
  asObject,
  nullableDescription,
  parsePositiveId,
  parseTrackList,
  requiredString,
  requireSessionUserId,
} from "../../../utils/validation";

defineRouteMeta({
  openAPI: {
    tags: ["Items"],
    summary: "Create item in category",
    description: "Atomically creates an item and its ordered track list.",
    parameters: [
      { in: "path", name: "id", required: true, schema: { type: "integer", minimum: 1 } },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["name"],
            properties: {
              name: { type: "string" },
              description: { type: "string", nullable: true },
              tracks: { type: "array", items: { type: "object" } },
            },
          },
        },
      },
    },
    responses: {
      201: { description: "Created item with tracks" },
      400: { description: "Invalid input" },
      401: { description: "Unauthorized" },
      404: { description: "Category not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const userId = await requireSessionUserId(event);
  const categoryId = parsePositiveId(event, "id", "category id");
  const body = asObject((await readBody(event)) ?? {});
  const itemId = createItemWithTracks(categoryId, userId, {
    name: requiredString(body.name, "name", 500),
    description: nullableDescription(body.description) ?? null,
    tracks: body.tracks === undefined ? [] : parseTrackList(body.tracks),
  });
  const item = getItemWithTracks(itemId)!;

  setResponseStatus(event, 201);
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    position: item.position,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    tracks: item.tracks,
  };
});
