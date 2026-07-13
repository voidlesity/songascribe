import { updateItemWithTracks } from "../../services/catalog/commands";
import { getItemWithTracks } from "../../services/catalog/queries";
import {
  asObject,
  badRequest,
  nullableDescription,
  optionalString,
  parseInteger,
  parsePositiveId,
  parseTrackList,
  requireSessionUserId,
} from "../../utils/validation";

defineRouteMeta({
  openAPI: {
    tags: ["Items"],
    summary: "Update item",
    description:
      "Partially updates an item. When tracks are supplied, replacement is atomic and preserves array order.",
    parameters: [
      { in: "path", name: "id", required: true, schema: { type: "integer", minimum: 1 } },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string", nullable: true },
              position: { type: "integer", minimum: 0, maximum: 1000000 },
              tracks: { type: "array", items: { type: "object" } },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Updated item" },
      400: { description: "Invalid id, fields, or empty patch" },
      401: { description: "Unauthorized" },
      404: { description: "Item not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const userId = await requireSessionUserId(event);
  const id = parsePositiveId(event, "id", "item id");
  const body = asObject((await readBody(event)) ?? {});
  const name = optionalString(body.name, "name", 500);
  const description = nullableDescription(body.description);
  const position =
    body.position === undefined
      ? undefined
      : parseInteger(body.position, "position", { min: 0, max: 1_000_000 });
  const tracks =
    body.tracks === undefined ? undefined : parseTrackList(body.tracks);

  if (
    name === undefined &&
    description === undefined &&
    position === undefined &&
    tracks === undefined
  ) {
    badRequest("No updatable fields provided");
  }

  updateItemWithTracks(id, userId, { name, description, position, tracks });
  const item = getItemWithTracks(id)!;
  return {
    id: item.id,
    categoryId: item.categoryId,
    name: item.name,
    description: item.description,
    position: item.position,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    tracks: item.tracks,
  };
});
