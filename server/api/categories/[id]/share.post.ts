import { createOrUpdateShare } from "../../../services/catalog/commands";
import {
  asObject,
  parseOptionalExpiry,
  parsePositiveId,
  requireSessionUserId,
} from "../../../utils/validation";

defineRouteMeta({
  openAPI: {
    tags: ["Share"],
    summary: "Create or retrieve category share",
    description:
      "Creates a share if absent. Optional expiresAt updates an existing share's expiry without rotating its token.",
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
      201: { description: "Share created or returned" },
      400: { description: "Invalid category id or expiry" },
      401: { description: "Unauthorized" },
      404: { description: "Category not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const userId = await requireSessionUserId(event);
  const categoryId = parsePositiveId(event, "id", "category id");
  const body = asObject((await readBody(event)) ?? {});
  const { share, created } = createOrUpdateShare(
    categoryId,
    userId,
    parseOptionalExpiry(body.expiresAt),
  );
  if (created) setResponseStatus(event, 201);
  return {
    token: share.token,
    url: `/share/${share.token}`,
    createdAt: share.createdAt,
    expiresAt: share.expiresAt,
  };
});
