import type { Track } from "../../../utils/nodelink";

defineRouteMeta({
  openAPI: {
    tags: ["Items"],
    summary: "Create item in category",
    parameters: [
      { in: "path", name: "id", required: true, schema: { type: "integer" } },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["name"],
            properties: {
              name: { type: "string" },
              description: { type: "string", nullable: true },
              tracks: { type: "array", items: { type: "object" } },
            },
          },
        },
      },
    },
    responses: {
      201: { description: "Created item" },
      400: { description: "Invalid input" },
      401: { description: "Unauthorized" },
      404: { description: "Category not found" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { user: sessionUser } = await requireUserSession(event);
  const categoryId = Number(getRouterParam(event, "id"));
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid category id",
    });
  }

  const category = db
    .select()
    .from(tables.categories)
    .where(
      and(
        eq(tables.categories.id, categoryId),
        eq(tables.categories.userId, (sessionUser as { id: number }).id),
      ),
    )
    .get();
  if (!category) {
    throw createError({ statusCode: 404, statusMessage: "Category not found" });
  }

  const body = await readBody<{
    name?: string;
    description?: string | null;
    tracks?: Track[];
  }>(event);

  const name = body.name?.trim();
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: "name is required" });
  }

  const maxPositionRow = db
    .select({ max: sql<number>`COALESCE(MAX(${tables.items.position}), -1)` })
    .from(tables.items)
    .where(eq(tables.items.categoryId, categoryId))
    .get();

  const now = new Date();
  const [item] = await db
    .insert(tables.items)
    .values({
      categoryId,
      name,
      description: body.description ?? null,
      position: (maxPositionRow?.max ?? -1) + 1,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  if (Array.isArray(body.tracks) && body.tracks.length > 0) {
    await setItemTracks(item!.id, body.tracks);
  }

  setResponseStatus(event, 201);
  return {
    id: item!.id,
    name: item!.name,
    description: item!.description,
    position: item!.position,
    createdAt: item!.createdAt,
    updatedAt: item!.updatedAt,
    tracks: await getItemTracks(item!.id),
  };
});
