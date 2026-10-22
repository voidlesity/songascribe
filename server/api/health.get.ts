defineRouteMeta({
  openAPI: {
    tags: ["System"],
    summary: "Health check",
    description: "Checks that SQLite responds and NodeLink is reachable.",
    responses: {
      200: { description: "Ready" },
      503: { description: "Database or NodeLink is not ready" },
    },
  },
});

export default defineEventHandler(async (event) => {
  let database = true;
  try {
    db.get(sql`select 1`);
  } catch (error) {
    console.error("[health] database check failed", error);
    database = false;
  }
  const nodelink = await isNodeLinkReachable();

  const ok = database && nodelink;
  if (!ok) setResponseStatus(event, 503);
  return { status: ok ? "ok" : "degraded", database, nodelink };
});
