import { checkNodeLink } from "../utils/nodelink";
import { getSqliteClient } from "../utils/drizzle";

defineRouteMeta({
  openAPI: {
    tags: ["System"],
    summary: "Health and readiness",
    description: "Checks SQLite responsiveness and the configured NodeLink service with a bounded timeout.",
    responses: {
      200: { description: "Ready" },
      503: { description: "Database or NodeLink is not ready" },
    },
  },
});

export default defineEventHandler(async (event) => {
  let database = false;
  try {
    getSqliteClient().prepare("SELECT 1").get();
    database = true;
  } catch (error) {
    console.error("[health] database check failed", error);
  }
  const nodeLink = await checkNodeLink();
  const ready = database && nodeLink;
  if (!ready) setResponseStatus(event, 503);
  return {
    status: ready ? "ok" : "degraded",
    checks: { database, nodeLink },
    timestamp: new Date().toISOString(),
  };
});
