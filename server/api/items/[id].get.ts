import { getItemWithTracks, getOwnedItem } from "../../services/catalog/queries";
import { parsePositiveId, requireSessionUserId } from "../../utils/validation";

defineRouteMeta({
  openAPI: {
    tags: ["Items"],
    summary: "Get item",
    parameters: [
      { in: "path", name: "id", required: true, schema: { type: "integer", minimum: 1 } },
    ],
    responses: {
      200: { description: "Item with ordered tracks" },
      400: { description: "Invalid item id" },
      401: { description: "Unauthorized" },
      404: { description: "Item not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const userId = await requireSessionUserId(event);
  const id = parsePositiveId(event, "id", "item id");
  if (!getOwnedItem(id, userId)) {
    throw createError({ statusCode: 404, statusMessage: "Item not found" });
  }
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
