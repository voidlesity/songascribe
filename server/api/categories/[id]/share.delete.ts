import { eq } from "drizzle-orm";

import { getOwnedCategory } from "../../../services/catalog/queries";
import { db, tables } from "../../../utils/drizzle";
import { parsePositiveId, requireSessionUserId } from "../../../utils/validation";

defineRouteMeta({
  openAPI: {
    tags: ["Share"],
    summary: "Revoke category share",
    parameters: [
      { in: "path", name: "id", required: true, schema: { type: "integer", minimum: 1 } },
    ],
    responses: {
      204: { description: "Share revoked" },
      400: { description: "Invalid category id" },
      401: { description: "Unauthorized" },
      404: { description: "Category or share not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const userId = await requireSessionUserId(event);
  const categoryId = parsePositiveId(event, "id", "category id");
  if (!getOwnedCategory(categoryId, userId)) {
    throw createError({ statusCode: 404, statusMessage: "Category not found" });
  }
  const deleted = db
    .delete(tables.shares)
    .where(eq(tables.shares.categoryId, categoryId))
    .returning({ id: tables.shares.id })
    .all();
  if (deleted.length === 0) {
    throw createError({ statusCode: 404, statusMessage: "Share not found" });
  }
  setResponseStatus(event, 204);
  return null;
});
