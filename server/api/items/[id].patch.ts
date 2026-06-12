import type { Track } from "../../utils/nodelink";

defineRouteMeta({
  openAPI: {
    tags: ["Items"],
    summary: "Update item",
    description:
      "Partially update an item. Providing `tracks` replaces the full track list (preserving order).",
    parameters: [
      { in: "path", name: "id", required: true, schema: { type: "integer" } },
    ],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string", nullable: true },
              position: { type: "integer" },
              tracks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    encoded: { type: "string" },
                    title: { type: "string" },
                    author: { type: "string" },
                    reason: { type: "string", nullable: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Updated item" },
      400: { description: "Invalid id or empty patch" },
      401: { description: "Unauthorized" },
      404: { description: "Item not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { user: sessionUser } = await requireUserSession(event);
  const id = Number(getRouterParam(event, "id"));
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: "Invalid item id" });
  }

  await getOwnedItem(id, (sessionUser as { id: number }).id);

  const body = ((await readBody<{
    name?: string;
    description?: string | null;
    position?: number;
    tracks?: Track[];
  }>(event)) ?? {}) as {
    name?: string;
    description?: string | null;
    position?: number;
    tracks?: Track[];
  };

  const patch: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim())
    patch.name = body.name.trim();
  if (body.description !== undefined) patch.description = body.description;
  if (typeof body.position === "number" && Number.isInteger(body.position))
    patch.position = body.position;

  const hasTracks = Array.isArray(body.tracks);

  if (Object.keys(patch).length === 0 && !hasTracks) {
    throw createError({
      statusCode: 400,
      statusMessage: "No updatable fields provided",
    });
  }

  if (Object.keys(patch).length > 0) {
    patch.updatedAt = new Date();
    await db.update(tables.items).set(patch).where(eq(tables.items.id, id));
  }

  if (hasTracks) {
    await setItemTracks(id, body.tracks!);
  }

  const item = db
    .select()
    .from(tables.items)
    .where(eq(tables.items.id, id))
    .get();
  return {
    id: item!.id,
    categoryId: item!.categoryId,
    name: item!.name,
    description: item!.description,
    position: item!.position,
    createdAt: item!.createdAt,
    updatedAt: item!.updatedAt,
    tracks: await getItemTracks(id),
  };
});
