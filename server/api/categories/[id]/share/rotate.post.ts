import { rotateShare } from "../../../../services/catalog/commands";
import {
  asObject,
  parseOptionalExpiry,
  parsePositiveId,
  requireSessionUserId,
} from "../../../../utils/validation";

defineRouteMeta({
  openAPI: {
    tags: ["Share"],
    summary: "Rotate category share token",
    description: "Atomically invalidates the old token and returns a new one. Existing expiry is preserved unless supplied.",
    parameters: [
      { in: "path", name: "id", required: true, schema: { type: "integer", minimum: 1 } },
    ],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              expiresAt: { type: "string", format: "date-time", nullable: true },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Rotated share" },
      400: { description: "Invalid category id or expiry" },
      401: { description: "Unauthorized" },
      404: { description: "Category or share not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const userId = await requireSessionUserId(event);
  const categoryId = parsePositiveId(event, "id", "category id");
  const body = asObject((await readBody(event)) ?? {});
  const row = rotateShare(
    categoryId,
    userId,
    parseOptionalExpiry(body.expiresAt),
  );
  return {
    token: row.token,
    url: `/share/${row.token}`,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
  };
});
