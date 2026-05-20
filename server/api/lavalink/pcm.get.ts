defineRouteMeta({
  openAPI: {
    tags: ["Lavalink"],
    summary: "Stream decoded PCM audio",
    description:
      "Proxies NodeLink's `POST /v4/loadStream` endpoint and streams 16-bit " +
      "little-endian PCM at 48 kHz stereo (audio/l16) to the browser. The " +
      "browser is expected to decode this with an AudioWorklet. Source-agnostic: " +
      "works for any source NodeLink can resolve.",
    parameters: [
      {
        in: "query",
        name: "encodedTrack",
        required: true,
        schema: { type: "string" },
        description: "Base64-encoded Lavalink/NodeLink track payload.",
      },
      {
        in: "query",
        name: "position",
        required: false,
        schema: { type: "integer" },
        description: "Start position in milliseconds. Defaults to 0.",
      },
      {
        in: "query",
        name: "volume",
        required: false,
        schema: { type: "integer" },
        description:
          "Server-side volume 0-1000 (100 = unity). Defaults to 100; do volume " +
          "in the browser via a GainNode for better UX.",
      },
    ],
    responses: {
      200: {
        description: "Raw signed 16-bit little-endian PCM, 48 kHz, stereo.",
        content: { "audio/l16": {} },
      },
      400: { description: "Missing encodedTrack" },
      502: { description: "Upstream NodeLink error" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { encodedTrack, position, volume } = getQuery(event);

  if (!encodedTrack || typeof encodedTrack !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: '"encodedTrack" query parameter is required',
    });
  }

  const config = useRuntimeConfig();
  const baseUrl = `http://${config.lavalink.host}:${config.lavalink.port}`;
  const password = config.lavalink.password as string;

  const positionMs = Number.isFinite(Number(position)) ? Number(position) : 0;
  const volumeValue = Number.isFinite(Number(volume)) ? Number(volume) : 100;

  const upstream = await fetch(`${baseUrl}/v4/loadstream`, {
    method: "POST",
    headers: {
      Authorization: password,
      "Content-Type": "application/json",
      Accept: "audio/l16;rate=48000;channels=2",
    },
    body: JSON.stringify({
      encodedTrack,
      position: positionMs,
      volume: volumeValue,
      filters: {},
    }),
  }).catch((err) => {
    console.error("[PCM proxy] Failed to reach NodeLink:", err);
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

  // Forward streaming PCM to the browser.
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
