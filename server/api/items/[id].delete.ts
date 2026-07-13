import { eq } from "drizzle-orm";

import { getOwnedItem } from "../../services/catalog/queries";
import { db, tables } from "../../utils/drizzle";
import { parsePositiveId, requireSessionUserId } from "../../utils/validation";

defineRouteMeta({
  openAPI: {
    tags: ["Items"],
    summary: "Delete item",
    parameters: [
      { in: "path", name: "id", required: true, schema: { type: "integer", minimum: 1 } },
    ],
    responses: {
      204: { description: "Item deleted" },
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
  db.delete(tables.items).where(eq(tables.items.id, id)).run();
  setResponseStatus(event, 204);
  return null;
});
