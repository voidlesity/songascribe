defineRouteMeta({
  openAPI: {
    tags: ["Audio"],
    summary: "Stream PCM audio",
    description:
      "Proxies NodeLink's signed 16-bit little-endian PCM (48 kHz stereo). The upstream stream is aborted when the client disconnects.",
    parameters: [
      {
        in: "query",
        name: "encoded",
        required: true,
        schema: { type: "string" },
      },
      {
        in: "query",
        name: "position",
        schema: { type: "integer", minimum: 0, default: 0 },
      },
      {
        in: "query",
        name: "volume",
        schema: { type: "integer", minimum: 0, maximum: 1000, default: 100 },
      },
    ],
    responses: {
      200: {
        description: "Raw 16-bit LE PCM, 48 kHz stereo",
        content: { "audio/l16": {} },
      },
      400: { description: "Invalid stream parameters" },
      502: { description: "NodeLink stream failed" },
      504: { description: "NodeLink connection timed out" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const encoded = requiredString(query.encoded, "encoded", 64 * 1024);
  const positionMs = parseInteger(query.position ?? 0, "position");
  const volume = parseInteger(query.volume ?? 100, "volume", { max: 1_000 });

  const clientGone = new AbortController();
  event.node.res.once("close", () => clientGone.abort());

  const upstream = await loadStream({
    encoded,
    positionMs,
    volume,
    signal: clientGone.signal,
  });
  if (!upstream.ok || !upstream.body) {
    await upstream.body?.cancel().catch(() => {});
    throw createError({
      statusCode: 502,
      statusMessage: "NodeLink stream failed",
    });
  }

  setResponseHeaders(event, {
    "Content-Type":
      upstream.headers.get("Content-Type") ?? "audio/l16;rate=48000;channels=2",
    "Cache-Control": "no-store",
  });
  return sendStream(event, upstream.body);
});
