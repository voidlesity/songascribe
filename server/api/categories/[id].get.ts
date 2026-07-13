import { getCategoryDetail } from "../../services/catalog/queries";
import { parsePositiveId } from "../../utils/validation";

defineRouteMeta({
  openAPI: {
    tags: ["Categories"],
    summary: "Get category",
    description:
      "Returns a category with ordered items and tracks. Visible to its owner, or to anyone when public.",
    parameters: [
      {
        in: "path",
        name: "id",
        required: true,
        schema: { type: "integer", minimum: 1 },
      },
    ],
    responses: {
      200: { description: "Category detail" },
      400: { description: "Invalid category id" },
      404: { description: "Category not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const id = parsePositiveId(event, "id", "category id");
  const category = getCategoryDetail(id);
  if (!category) {
    throw createError({ statusCode: 404, statusMessage: "Category not found" });
  }

  if (!category.isPublic) {
    const session = await getUserSession(event);
    if ((session.user as { id?: number } | undefined)?.id !== category.userId) {
      throw createError({ statusCode: 404, statusMessage: "Category not found" });
    }
  }

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
