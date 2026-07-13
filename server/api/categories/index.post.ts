import { db, tables } from "../../utils/drizzle";
import {
  asObject,
  booleanValue,
  nullableDescription,
  requiredString,
  requireSessionUserId,
} from "../../utils/validation";

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
      201: { description: "Created category" },
      400: { description: "Invalid fields" },
      401: { description: "Unauthorized" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const userId = await requireSessionUserId(event);
  const body = asObject((await readBody(event)) ?? {});
  const now = new Date();
  const row = db
    .insert(tables.categories)
    .values({
      userId,
      name: requiredString(body.name, "name", 500),
      description: nullableDescription(body.description) ?? null,
      isPublic:
        body.isPublic === undefined
          ? false
          : booleanValue(body.isPublic, "isPublic"),
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  setResponseStatus(event, 201);
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isPublic: row.isPublic,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
});
