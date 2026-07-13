import { exportLibrary } from "../../services/catalog/library";
import { requireSessionUserId } from "../../utils/validation";

defineRouteMeta({
  openAPI: {
    tags: ["Library"],
    summary: "Export library as JSON",
    description: "Exports all authenticated-user categories, ordered items, tracks, and reasons in a versioned transport-safe format.",
    responses: {
      200: {
        description: "Versioned library export",
        content: { "application/json": {} },
      },
      401: { description: "Unauthorized" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const userId = await requireSessionUserId(event);
  setResponseHeader(
    event,
    "Content-Disposition",
    `attachment; filename="songascribe-library-${new Date().toISOString().slice(0, 10)}.json"`,
  );
  return exportLibrary(userId);
});
