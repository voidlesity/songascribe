import { eq } from "drizzle-orm";

import { getOwnedCategory } from "../../services/catalog/queries";
import { db, tables } from "../../utils/drizzle";
import {
  asObject,
  badRequest,
  booleanValue,
  nullableDescription,
  optionalString,
  parsePositiveId,
  requireSessionUserId,
} from "../../utils/validation";

defineRouteMeta({
  openAPI: {
    tags: ["Categories"],
    summary: "Update category",
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
              isPublic: { type: "boolean" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Updated category" },
      400: { description: "Invalid fields or empty patch" },
      401: { description: "Unauthorized" },
      404: { description: "Category not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const userId = await requireSessionUserId(event);
  const id = parsePositiveId(event, "id", "category id");
  if (!getOwnedCategory(id, userId)) {
    throw createError({ statusCode: 404, statusMessage: "Category not found" });
  }
  const body = asObject((await readBody(event)) ?? {});
  const name = optionalString(body.name, "name", 500);
  const description = nullableDescription(body.description);
  const isPublic =
    body.isPublic === undefined
      ? undefined
      : booleanValue(body.isPublic, "isPublic");
  if (name === undefined && description === undefined && isPublic === undefined) {
    badRequest("No updatable fields provided");
  }

  const row = db
    .update(tables.categories)
    .set({ name, description, isPublic, updatedAt: new Date() })
    .where(eq(tables.categories.id, id))
    .returning()
    .get();
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isPublic: row.isPublic,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
});
