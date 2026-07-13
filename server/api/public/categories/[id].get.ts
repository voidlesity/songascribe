import { getPublicCategoryDetail } from "../../../services/catalog/queries";
import { parsePositiveId } from "../../../utils/validation";

defineRouteMeta({
  openAPI: {
    tags: ["Public"],
    summary: "Get public category",
    parameters: [
      {
        in: "path",
        name: "id",
        required: true,
        schema: { type: "integer", minimum: 1 },
      },
    ],
    responses: {
      200: { description: "Public category detail" },
      400: { description: "Invalid category id" },
      404: { description: "Category not found or not public" },
    },
  },
});

export default defineEventHandler((event) => {
  const id = parsePositiveId(event, "id", "category id");
  const category = getPublicCategoryDetail(id);
  if (!category) {
    throw createError({ statusCode: 404, statusMessage: "Category not found" });
  }

  return {
    id: category.id,
    name: category.name,
    description: category.description,
    createdAt: category.createdAt,
    items: category.items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      position: item.position,
      tracks: item.tracks,
    })),
  };
});
