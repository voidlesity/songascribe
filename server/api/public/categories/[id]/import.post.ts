import { importPublicCategory } from "../../../../services/catalog/commands";
import { getCategoryDetail } from "../../../../services/catalog/queries";
import {
  parsePositiveId,
  requireSessionUserId,
} from "../../../../utils/validation";

defineRouteMeta({
  openAPI: {
    tags: ["Public", "Categories"],
    summary: "Import public category",
    description: "Copies a public category, its ordered items, tracks, and reasons into the authenticated user's library as private.",
    parameters: [
      { in: "path", name: "id", required: true, schema: { type: "integer", minimum: 1 } },
    ],
    responses: {
      201: { description: "Imported private category" },
      400: { description: "Invalid category id" },
      401: { description: "Unauthorized" },
      404: { description: "Public category not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const userId = await requireSessionUserId(event);
  const sourceId = parsePositiveId(event, "id", "category id");
  const result = importPublicCategory(sourceId, userId);
  const category = getCategoryDetail(result.categoryId)!;
  setResponseStatus(event, 201);
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    isPublic: category.isPublic,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
    items: category.items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      position: item.position,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      tracks: item.tracks,
    })),
  };
});
