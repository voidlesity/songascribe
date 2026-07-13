import { and, eq } from "drizzle-orm";

import { db, tables } from "../../utils/drizzle";
import { parsePositiveId, requireSessionUserId } from "../../utils/validation";

defineRouteMeta({
  openAPI: {
    tags: ["Categories"],
    summary: "Delete category",
    description: "Deletes a category and cascading items, item-track links, and share.",
    parameters: [
      { in: "path", name: "id", required: true, schema: { type: "integer", minimum: 1 } },
    ],
    responses: {
      204: { description: "Category deleted" },
      400: { description: "Invalid category id" },
      401: { description: "Unauthorized" },
      404: { description: "Category not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const userId = await requireSessionUserId(event);
  const id = parsePositiveId(event, "id", "category id");
  const deleted = db
    .delete(tables.categories)
    .where(
      and(eq(tables.categories.id, id), eq(tables.categories.userId, userId)),
    )
    .returning({ id: tables.categories.id })
    .all();
  if (deleted.length === 0) {
    throw createError({ statusCode: 404, statusMessage: "Category not found" });
  }
  setResponseStatus(event, 204);
  return null;
});
