import { reorderCategoryItems } from "../../../../services/catalog/commands";
import {
  asObject,
  parseIdList,
  parsePositiveId,
  requireSessionUserId,
} from "../../../../utils/validation";

defineRouteMeta({
  openAPI: {
    tags: ["Items"],
    summary: "Reorder category items",
    description: "Atomically replaces item positions. Every category item id must appear exactly once.",
    parameters: [
      { in: "path", name: "id", required: true, schema: { type: "integer", minimum: 1 } },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["itemIds"],
            properties: {
              itemIds: {
                type: "array",
                items: { type: "integer", minimum: 1 },
              },
            },
          },
        },
      },
    },
    responses: {
      204: { description: "Items reordered" },
      400: { description: "Invalid or incomplete item id list" },
      401: { description: "Unauthorized" },
      404: { description: "Category not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const userId = await requireSessionUserId(event);
  const categoryId = parsePositiveId(event, "id", "category id");
  const body = asObject((await readBody(event)) ?? {});
  reorderCategoryItems(
    categoryId,
    userId,
    parseIdList(body.itemIds, "itemIds", 10_000),
  );
  setResponseStatus(event, 204);
  return null;
});
