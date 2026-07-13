import { eq } from "drizzle-orm";

import { db, tables } from "../../utils/drizzle";
import {
  asObject,
  optionalString,
  requireSessionUserId,
} from "../../utils/validation";

defineRouteMeta({
  openAPI: {
    tags: ["Users"],
    summary: "Update current user",
    description: "Partially updates the authenticated user's profile.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: { theme: { type: "string" } },
          },
        },
      },
    },
    responses: {
      200: { description: "Updated user" },
      400: { description: "Invalid or empty patch" },
      401: { description: "Unauthorized" },
      404: { description: "User not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const userId = await requireSessionUserId(event);
  const body = asObject((await readBody(event)) ?? {});
  const theme = optionalString(body.theme, "theme", 100);
  if (theme === undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: "No updatable fields provided",
    });
  }

  const updated = db
    .update(tables.users)
    .set({ theme, updatedAt: new Date() })
    .where(eq(tables.users.id, userId))
    .returning()
    .get();
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: "User not found" });
  }

  await setUserSession(event, {
    user: {
      id: updated.id,
      username: updated.username,
      avatar: updated.avatar,
      theme: updated.theme,
    },
  });
  return {
    id: updated.id,
    email: updated.email,
    username: updated.username,
    avatar: updated.avatar,
    theme: updated.theme,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
});
