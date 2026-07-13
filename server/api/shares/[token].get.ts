import { eq } from "drizzle-orm";

import { getCategoryDetail } from "../../services/catalog/queries";
import { db, tables } from "../../utils/drizzle";
import { requiredString } from "../../utils/validation";

defineRouteMeta({
  openAPI: {
    tags: ["Share"],
    summary: "Resolve share token",
    description: "Public endpoint that resolves a non-expired share token.",
    parameters: [
      {
        in: "path",
        name: "token",
        required: true,
        schema: { type: "string" },
      },
    ],
    responses: {
      200: { description: "Shared category detail" },
      400: { description: "Invalid token" },
      404: { description: "Share not found or expired" },
    },
  },
});

export default defineEventHandler((event) => {
  const token = requiredString(getRouterParam(event, "token"), "token", 200);
  const share = db
    .select()
    .from(tables.shares)
    .where(eq(tables.shares.token, token))
    .get();

  if (!share) {
    throw createError({ statusCode: 404, statusMessage: "Share not found" });
  }
  if (share.expiresAt && share.expiresAt.getTime() <= Date.now()) {
    throw createError({ statusCode: 404, statusMessage: "Share has expired" });
  }

  const category = getCategoryDetail(share.categoryId);
  if (!category) {
    throw createError({ statusCode: 404, statusMessage: "Category not found" });
  }

  return {
    id: category.id,
    name: category.name,
    description: category.description,
    items: category.items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      position: item.position,
      tracks: item.tracks,
    })),
  };
});
