import { NodeLinkError, loadStream } from "../../utils/nodelink";
import { parseInteger, requiredString } from "../../utils/validation";

defineRouteMeta({
  openAPI: {
    tags: ["Audio"],
    summary: "Stream PCM audio",
    description: "Proxies NodeLink signed 16-bit little-endian PCM at 48 kHz stereo and aborts upstream work when the client disconnects.",
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
        schema: { type: "integer", minimum: 0, maximum: 604800000, default: 0 },
      },
      {
        in: "query",
        name: "volume",
        schema: { type: "integer", minimum: 0, maximum: 1000, default: 100 },
      },
    ],
    responses: {
      200: { description: "Raw 16-bit LE PCM, 48 kHz stereo", content: { "audio/l16": {} } },
      400: { description: "Invalid stream parameters" },
      502: { description: "NodeLink stream failed" },
      504: { description: "NodeLink connection timed out" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const encoded = requiredString(query.encoded, "encoded", 64 * 1024);
  const positionMs = parseInteger(query.position ?? 0, "position", {
    min: 0,
    max: 604_800_000,
  });
  const volume = parseInteger(query.volume ?? 100, "volume", {
    min: 0,
    max: 1_000,
  });
  const clientAbort = new AbortController();
  event.node.req.once("aborted", () => clientAbort.abort());
  event.node.res.once("close", () => clientAbort.abort());

  let upstream: Response;
  try {
    upstream = await loadStream({
      encoded,
      positionMs,
      volume,
      signal: clientAbort.signal,
    });
  } catch (error) {
    if (error instanceof NodeLinkError) {
      throw createError({ statusCode: error.statusCode, statusMessage: error.message });
    }
    throw createError({ statusCode: 502, statusMessage: "NodeLink stream failed" });
  }

  if (!upstream.ok || !upstream.body) {
    await upstream.body?.cancel().catch(() => undefined);
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
  return sendStream(
    event,
    upstream.body as unknown as ReadableStream<Uint8Array>,
  );
});
