defineRouteMeta({
  openAPI: {
    tags: ["Audio"],
    summary: "Stream PCM audio",
    description:
      "Proxies NodeLink's loadStream endpoint, streaming signed 16-bit " +
      "little-endian PCM at 48 kHz stereo (audio/l16). Consumed by an " +
      "AudioWorklet in the browser.",
    parameters: [
      {
        in: "query",
        name: "encoded",
        required: true,
        schema: { type: "string" },
        description: "Encoded NodeLink track payload.",
      },
      {
        in: "query",
        name: "position",
        schema: { type: "integer", minimum: 0, default: 0 },
        description: "Start position in milliseconds.",
      },
      {
        in: "query",
        name: "volume",
        schema: { type: "integer", minimum: 0, maximum: 1000, default: 100 },
        description: "Server-side volume; 100 = unity.",
      },
    ],
    responses: {
      200: {
        description: "Raw 16-bit LE PCM, 48 kHz stereo",
        content: { "audio/l16": {} },
      },
      400: { description: "Missing encoded" },
      502: { description: "Upstream NodeLink error" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { encoded, position, volume } = getQuery(event);

  if (typeof encoded !== "string" || !encoded) {
    throw createError({
      statusCode: 400,
      statusMessage: "encoded is required",
    });
  }

  const positionMs = Number.isFinite(Number(position)) ? Number(position) : 0;
  const volumeValue = Number.isFinite(Number(volume)) ? Number(volume) : 100;

  const upstream = await loadStream({
    encoded,
    positionMs,
    volume: volumeValue,
  }).catch((err) => {
    console.error("[Audio stream] NodeLink unreachable:", err);
    return null;
  });

  if (!upstream || !upstream.ok || !upstream.body) {
    const status = upstream?.status ?? 502;
    const text = upstream ? await upstream.text().catch(() => "") : "";
    throw createError({
      statusCode: status >= 400 ? status : 502,
      statusMessage: text || "NodeLink loadStream failed",
    });
  }

  setResponseHeader(
    event,
    "Content-Type",
    upstream.headers.get("Content-Type") ?? "audio/l16;rate=48000;channels=2",
  );
  setResponseHeader(event, "Cache-Control", "no-store");
  setResponseHeader(event, "Transfer-Encoding", "chunked");

  return sendStream(
    event,
    upstream.body as unknown as ReadableStream<Uint8Array>,
  );
});
