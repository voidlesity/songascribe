import { requireSessionUserId } from "../../utils/validation";

defineRouteMeta({
  openAPI: {
    tags: ["Users"],
    summary: "Delete current user",
    description:
      "Permanently deletes the authenticated user's account and all associated data.",
    responses: {
      204: { description: "Account deleted" },
      401: { description: "Unauthorized" },
      404: { description: "User not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const userId = await requireSessionUserId(event);

  const [deleted] = await db
    .delete(tables.users)
    .where(eq(tables.users.id, userId))
    .returning();

  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: "User not found" });
  }

  await clearUserSession(event);

  setResponseStatus(event, 204);
  return null;
});
