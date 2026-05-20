/**
 * NodeLink (Lavalink v4 compatible) client.
 *
 * Wraps NodeLink's REST endpoints and normalizes track data into the unified
 * `Track` DTO used everywhere in our API and database.
 */

export interface NodelinkRawTrackInfo {
  identifier: string;
  isSeekable: boolean;
  author: string;
  length: number;
  isStream: boolean;
  position: number;
  title: string;
  uri: string | null;
  sourceName: string;
  artworkUrl: string | null;
  isrc: string | null;
}

export interface NodelinkRawTrack {
  encoded: string;
  info: NodelinkRawTrackInfo;
  pluginInfo?: Record<string, unknown>;
  userData?: Record<string, unknown>;
}

export interface NodelinkLoadResult {
  loadType: "track" | "playlist" | "search" | "empty" | "error";
  data:
    | NodelinkRawTrack
    | NodelinkRawTrack[]
    | {
        info: { name: string; selectedTrack: number };
        tracks: NodelinkRawTrack[];
      }
    | Record<string, unknown>;
}

/** Unified track shape returned by every Songascribe endpoint. */
export interface Track {
  id?: number;
  encoded: string;
  identifier: string;
  source: string;
  title: string;
  author: string;
  lengthMs: number;
  uri: string | null;
  artworkUrl: string | null;
  isrc: string | null;
  isStream: boolean;
  isSeekable: boolean;
}

function getBase() {
  const config = useRuntimeConfig();
  return {
    baseUrl: `http://${config.nodelink.host}:${config.nodelink.port}`,
    headers: { Authorization: config.nodelink.password as string },
  };
}

export function toTrack(raw: NodelinkRawTrack): Track {
  return {
    encoded: raw.encoded,
    identifier: raw.info.identifier,
    source: raw.info.sourceName,
    title: raw.info.title,
    author: raw.info.author,
    lengthMs: raw.info.length ?? 0,
    uri: raw.info.uri ?? null,
    artworkUrl: raw.info.artworkUrl ?? null,
    isrc: raw.info.isrc ?? null,
    isStream: Boolean(raw.info.isStream),
    isSeekable: raw.info.isSeekable !== false,
  };
}

/**
 * Search NodeLink for tracks. Returns a normalized list — for `track` loadType
 * a single-element array; for `playlist` the playlist tracks in order.
 */
export async function searchTracks(query: string): Promise<Track[]> {
  const { baseUrl, headers } = getBase();
  const identifier = query.startsWith("http") ? query : `ytmsearch:${query}`;

  try {
    const result = await $fetch<NodelinkLoadResult>(
      `${baseUrl}/v4/loadtracks`,
      {
        headers,
        params: { identifier },
      },
    );

    switch (result.loadType) {
      case "track":
        return [toTrack(result.data as NodelinkRawTrack)];
      case "search":
        return (result.data as NodelinkRawTrack[]).map(toTrack);
      case "playlist": {
        const playlist = result.data as {
          tracks: NodelinkRawTrack[];
        };
        return (playlist.tracks ?? []).map(toTrack);
      }
      default:
        return [];
    }
  } catch (error) {
    console.error("[NodeLink] searchTracks error:", error);
    return [];
  }
}

export async function decodeTrack(encoded: string): Promise<Track | null> {
  const { baseUrl, headers } = getBase();

  try {
    const raw = await $fetch<NodelinkRawTrack>(`${baseUrl}/v4/decodetrack`, {
      headers,
      params: { track: encoded },
    });
    if (!raw?.info) return null;
    return toTrack({ ...raw, encoded });
  } catch (error) {
    console.error("[NodeLink] decodeTrack error:", error);
    return null;
  }
}

export interface LoadStreamOptions {
  encoded: string;
  positionMs?: number;
  volume?: number;
  signal?: AbortSignal;
}

/** Open a raw PCM stream from NodeLink's loadStream endpoint. */
export async function loadStream(opts: LoadStreamOptions): Promise<Response> {
  const { baseUrl, headers } = getBase();
  return fetch(`${baseUrl}/v4/loadstream`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
      Accept: "audio/l16;rate=48000;channels=2",
    },
    body: JSON.stringify({
      encodedTrack: opts.encoded,
      position: opts.positionMs ?? 0,
      volume: opts.volume ?? 100,
      filters: {},
    }),
    signal: opts.signal,
  });
}
