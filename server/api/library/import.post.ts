import { importLibrary } from "../../services/catalog/commands";
import { validateLibraryImport } from "../../services/catalog/library";
import { badRequest, requireSessionUserId } from "../../utils/validation";

const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

defineRouteMeta({
  openAPI: {
    tags: ["Library"],
    summary: "Import library JSON",
    description: "Validates a versioned export and atomically appends all categories, ordered items, tracks, and reasons to the authenticated user's library.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["version", "categories"],
            properties: {
              version: { type: "integer", enum: [1] },
              categories: { type: "array", items: { type: "object" } },
            },
          },
        },
      },
    },
    responses: {
      201: { description: "Atomic import summary" },
      400: { description: "Invalid export JSON or limits exceeded" },
      401: { description: "Unauthorized" },
      413: { description: "Import exceeds 5 MiB" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const userId = await requireSessionUserId(event);
  const declaredLength = Number(getHeader(event, "content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_IMPORT_BYTES) {
    throw createError({ statusCode: 413, statusMessage: "Import exceeds 5 MiB" });
  }
  const raw = await readRawBody(event, "utf8");
  if (!raw) badRequest("JSON body is required");
  if (Buffer.byteLength(raw, "utf8") > MAX_IMPORT_BYTES) {
    throw createError({ statusCode: 413, statusMessage: "Import exceeds 5 MiB" });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    badRequest("Body must be valid JSON");
  }
  const result = importLibrary(userId, validateLibraryImport(parsed));
  setResponseStatus(event, 201);
  return result;
});
