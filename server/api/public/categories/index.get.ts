import { listPublicCategories } from "../../../services/catalog/queries";
import { parseInteger } from "../../../utils/validation";

defineRouteMeta({
  openAPI: {
    tags: ["Public"],
    summary: "List public categories",
    parameters: [
      { in: "query", name: "search", schema: { type: "string" } },
      {
        in: "query",
        name: "page",
        schema: { type: "integer", minimum: 1, default: 1 },
      },
      {
        in: "query",
        name: "limit",
        schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
      },
    ],
    responses: {
      200: { description: "Paginated public category summaries" },
      400: { description: "Invalid pagination or search parameters" },
    },
  },
});

export default defineEventHandler((event) => {
  const query = getQuery(event);
  const page = parseInteger(query.page ?? 1, "page", {
    min: 1,
    max: 1_000_000,
  });
  const limit = parseInteger(query.limit ?? 20, "limit", { min: 1, max: 100 });
  const search = typeof query.search === "string" ? query.search.trim() : "";
  if (search.length > 200) {
    throw createError({
      statusCode: 400,
      statusMessage: "search must be at most 200 characters",
    });
  }

  const result = listPublicCategories({ search, page, limit });
  return {
    data: result.data,
    pagination: {
      page,
      limit,
      total: result.total,
      pages: Math.ceil(result.total / limit),
    },
  };
});
