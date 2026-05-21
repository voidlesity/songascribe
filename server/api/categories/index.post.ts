defineRouteMeta({
  openAPI: {
    tags: ["Categories"],
    summary: "Create category",
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
              isPublic: { type: "boolean", default: false },
            },
          },
        },
      },
    },
    responses: {
      201: { description: "Created" },
      400: { description: "Missing fields" },
      401: { description: "Unauthorized" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { user: sessionUser } = await requireUserSession(event);
  const body = await readBody<{
    name?: string;
    description?: string | null;
    isPublic?: boolean;
  }>(event);

  const name = body.name?.trim();
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: "name is required" });
  }

  const now = new Date();
  const [row] = await db
    .insert(tables.categories)
    .values({
      userId: (sessionUser as { id: number }).id,
      name,
      description: body.description ?? null,
      isPublic: Boolean(body.isPublic),
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  setResponseStatus(event, 201);
  return {
    id: row!.id,
    name: row!.name,
    description: row!.description,
    isPublic: row!.isPublic,
    createdAt: row!.createdAt,
    updatedAt: row!.updatedAt,
  };
});
