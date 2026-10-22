/**
 * NodeLink (Lavalink v4 compatible) client. Failures surface as 502/504 H3
 * errors so handlers can simply let them propagate.
 */

const MAX_SEARCH_RESULTS = 100;

interface NodelinkTrack {
  encoded: string;
  info: {
    identifier: string;
    isSeekable: boolean;
    author: string;
    length: number;
    isStream: boolean;
    title: string;
    uri: string | null;
    sourceName: string;
    artworkUrl: string | null;
    isrc: string | null;
  };
}

type NodelinkLoadResult =
  | { loadType: "track"; data: NodelinkTrack }
  | { loadType: "search"; data: NodelinkTrack[] }
  | { loadType: "playlist"; data: { tracks: NodelinkTrack[] } }
  | { loadType: "empty"; data: null }
  | { loadType: "error"; data: { message?: string } };

function connection() {
  const { host, port, password, timeoutMs } = useRuntimeConfig().nodelink;
  return {
    baseUrl: `http://${host}:${port}`,
    headers: { Authorization: String(password) },
    timeout: Number(timeoutMs),
  };
}

function upstreamError(error: unknown): never {
  if (isError(error)) throw error;
  const cause = error instanceof Error ? (error.cause ?? error) : error;
  const timedOut =
    cause instanceof Error &&
    (cause.name === "TimeoutError" || cause.name === "AbortError");
  console.error("[nodelink]", error);
  throw createError(
    timedOut
      ? { statusCode: 504, statusMessage: "NodeLink request timed out" }
      : { statusCode: 502, statusMessage: "NodeLink is unavailable" },
  );
}

function toTrack({ encoded, info }: NodelinkTrack): Track {
  return {
    encoded,
    identifier: info.identifier,
    source: info.sourceName,
    title: info.title,
    author: info.author,
    lengthMs: info.length ?? 0,
    uri: info.uri ?? null,
    artworkUrl: info.artworkUrl ?? null,
    isrc: info.isrc ?? null,
    isStream: Boolean(info.isStream),
    isSeekable: info.isSeekable !== false,
  };
}

/** URLs are loaded directly, anything else is a YouTube Music search. */
export async function searchTracks(query: string): Promise<Track[]> {
  const { baseUrl, headers, timeout } = connection();
  const identifier = /^https?:\/\//i.test(query) ? query : `ytmsearch:${query}`;
  const result = await $fetch<NodelinkLoadResult>(`${baseUrl}/v4/loadtracks`, {
    headers,
    timeout,
    query: { identifier },
  }).catch(upstreamError);

  switch (result.loadType) {
    case "track":
      return [toTrack(result.data)];
    case "search":
      return result.data.slice(0, MAX_SEARCH_RESULTS).map(toTrack);
    case "playlist":
      return result.data.tracks.slice(0, MAX_SEARCH_RESULTS).map(toTrack);
    case "error":
      throw createError({
        statusCode: 502,
        statusMessage: result.data.message || "NodeLink could not load media",
      });
    default:
      return [];
  }
}

export async function decodeTrack(encoded: string): Promise<Track> {
  const { baseUrl, headers, timeout } = connection();
  const raw = await $fetch<NodelinkTrack>(`${baseUrl}/v4/decodetrack`, {
    headers,
    timeout,
    query: { track: encoded },
  }).catch((error) => {
    if (error?.statusCode === 400 || error?.statusCode === 404) {
      throw createError({ statusCode: 404, statusMessage: "Track not found" });
    }
    upstreamError(error);
  });
  return toTrack({ ...raw, encoded });
}

export interface LoadStreamOptions {
  encoded: string;
  positionMs?: number;
  volume?: number;
  signal?: AbortSignal;
}

/**
 * Open a raw PCM stream. The timeout only covers waiting for the response
 * headers; the stream itself may run for as long as the track does.
 */
export async function loadStream({
  encoded,
  positionMs = 0,
  volume = 100,
  signal,
}: LoadStreamOptions): Promise<Response> {
  const { baseUrl, headers, timeout } = connection();
  const connectTimeout = new AbortController();
  const timer = setTimeout(
    () => connectTimeout.abort(new DOMException("Timed out", "TimeoutError")),
    timeout,
  );

  try {
    return await fetch(`${baseUrl}/v4/loadstream`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
        Accept: "audio/l16;rate=48000;channels=2",
      },
      body: JSON.stringify({
        encodedTrack: encoded,
        position: positionMs,
        volume,
        filters: {},
      }),
      signal: signal
        ? AbortSignal.any([signal, connectTimeout.signal])
        : connectTimeout.signal,
    });
  } catch (error) {
    upstreamError(error);
  } finally {
    clearTimeout(timer);
  }
}

export async function isNodeLinkReachable(): Promise<boolean> {
  const { baseUrl, headers } = connection();
  try {
    const response = await fetch(`${baseUrl}/version`, {
      headers,
      signal: AbortSignal.timeout(2_500),
    });
    return response.ok;
  } catch {
    return false;
  }
}
