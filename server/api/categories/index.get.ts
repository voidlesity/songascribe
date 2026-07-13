import { getOwnedCategoryDetails } from "../../services/catalog/queries";
import { requireSessionUserId } from "../../utils/validation";

defineRouteMeta({
  openAPI: {
    tags: ["Categories"],
    summary: "List own categories",
    description:
      "Returns all categories owned by the authenticated user, including ordered items and tracks.",
    responses: {
      200: { description: "List of category details" },
      401: { description: "Unauthorized" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const userId = await requireSessionUserId(event);
  return getOwnedCategoryDetails(userId).map((category) => ({
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
  }));
});
