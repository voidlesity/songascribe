const config = useRuntimeConfig();
const baseUrl = `http://${config.lavalink.host}:${config.lavalink.port}`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TrackInfo {
  identifier: string;
  isSeekable: boolean;
  author: string;
  length: number;
  isStream: boolean;
  position: number;
  title: string;
  uri: string;
  sourceName: string;
  artworkUrl?: string | null;
  isrc?: string | null;
}

export interface LavalinkTrack {
  encoded: string;
  info: TrackInfo;
  pluginInfo?: Record<string, unknown>;
}

export interface PlaylistInfo {
  name: string;
  selectedTrack: number;
}

type LoadType = "track" | "playlist" | "search" | "empty" | "error";

interface TrackLoadResult {
  loadType: "track";
  data: LavalinkTrack;
}

interface PlaylistLoadResult {
  loadType: "playlist";
  data: {
    info: PlaylistInfo;
    pluginInfo: Record<string, unknown>;
    tracks: LavalinkTrack[];
  };
}

interface SearchLoadResult {
  loadType: "search";
  data: LavalinkTrack[];
}

interface EmptyLoadResult {
  loadType: "empty";
  data: null;
}

interface ErrorLoadResult {
  loadType: "error";
  data: {
    message: string;
    severity: string;
    cause: string;
  };
}

type LoadResult =
  | TrackLoadResult
  | PlaylistLoadResult
  | SearchLoadResult
  | EmptyLoadResult
  | ErrorLoadResult;

/** Shape that matches the `songs` drizzle table columns exactly. */
export interface SongRecord {
  track_id: string;
  name: string;
  artist: string;
  image: string | null;
  duration: number;
  url: string;
  source: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function authHeaders() {
  return { Authorization: config.lavalink.password };
}

function tracksFromResult(result: LoadResult): LavalinkTrack[] {
  switch (result.loadType) {
    case "track":
      return [result.data];
    case "search":
      return result.data ?? [];
    case "playlist":
      return result.data?.tracks ?? [];
    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Search for tracks on Lavalink.
 *
 * - Passing a URL will load it directly (supports `loadType: "track"` and
 *   `loadType: "playlist"`).
 * - Passing plain text will prefix with `ytmsearch:` and return search hits.
 */
export async function searchTracks(query: string): Promise<LavalinkTrack[]> {
  const identifier = query.startsWith("http") ? query : `ytmsearch:${query}`;

  try {
    const result = await $fetch<LoadResult>(`${baseUrl}/v4/loadtracks`, {
      headers: authHeaders(),
      params: { identifier },
    });

    return tracksFromResult(result);
  } catch (error) {
    console.error("[Lavalink] searchTracks error:", error);
    return [];
  }
}

/**
 * Decode a base-64 encoded Lavalink track string back into a `LavalinkTrack`.
 * Uses the `/v4/decodetrack` endpoint with the correct `encodedTrack` param.
 */
export async function decodeTrack(
  encoded: string,
): Promise<LavalinkTrack | null> {
  try {
    const track = await $fetch<LavalinkTrack>(`${baseUrl}/v4/decodetrack`, {
      headers: authHeaders(),
      params: { encodedTrack: encoded },
    });
    return track;
  } catch (error) {
    console.error("[Lavalink] decodeTrack error:", error);
    return null;
  }
}

/**
 * Resolve a track from either a URL or a base-64 encoded track string.
 *
 * - URLs are forwarded to `searchTracks` which handles direct loading.
 * - Everything else is treated as an encoded track and decoded via
 *   `decodeTrack`.
 */
export async function resolveTrack(
  query: string,
): Promise<LavalinkTrack | null> {
  if (query.startsWith("http")) {
    const tracks = await searchTracks(query);
    return tracks[0] ?? null;
  }

  return decodeTrack(query);
}

/**
 * Try to find a track that matches a given ISRC.
 *
 * Searches YouTube Music for the ISRC string and returns the first result
 * whose `info.isrc` matches exactly, falling back to the first result if none
 * match exactly.
 */
export async function resolveTrackFromISRC(
  isrc: string,
): Promise<LavalinkTrack | null> {
  try {
    // searchTracks already adds `ytmsearch:` for plain text — do NOT pre-add it
    const tracks = await searchTracks(isrc);
    if (tracks.length === 0) return null;
    return tracks.find((t) => t.info.isrc === isrc) ?? tracks[0] ?? null;
  } catch (error) {
    console.error("[Lavalink] resolveTrackFromISRC error:", error);
    return null;
  }
}

/**
 * Convert a `LavalinkTrack` into the shape expected by the `songs` DB table.
 *
 * Column mapping:
 *   `image`    → `album_art` column in SQLite (drizzle field name is `image`)
 */
export function formatTrackForDatabase(track: LavalinkTrack): SongRecord {
  return {
    track_id: track.encoded,
    name: track.info.title,
    artist: track.info.author,
    image: track.info.artworkUrl ?? null,
    duration: track.info.length,
    url: track.info.uri,
    source: track.info.sourceName,
  };
}
