const config = useRuntimeConfig();
const baseUrl = `http://${config.lavalink.host}:${config.lavalink.port}`;
const headers = { Authorization: config.lavalink.password };

export interface LavalinkTrackInfo {
  identifier: string;
  isSeekable: boolean;
  author: string;
  length: number;
  isStream: boolean;
  position: number;
  title: string;
  uri: string;
  sourceName: string;
  artworkUrl: string;
  isrc: string;
}

export interface LavalinkTrack {
  encoded: string;
  info: LavalinkTrackInfo;
  pluginInfo: Record<string, any>;
  userData: Record<string, any>;
}

export interface LavalinkSearchResult {
  loadType: "track" | "playlist" | "search" | "empty" | "error";
  data:
    | LavalinkTrack[]
    | { info: { name: string; selectedTrack: number }; tracks: LavalinkTrack[] }
    | Record<string, any>;
}

export async function searchTracks(
  query: string,
): Promise<LavalinkSearchResult> {
  const identifier = query.startsWith("http") ? query : `ytmsearch:${query}`;

  try {
    const result = await $fetch<LavalinkSearchResult>(
      `${baseUrl}/v4/loadtracks`,
      {
        headers,
        params: { identifier },
      },
    );
    return result;
  } catch (error) {
    console.error("[Lavalink] searchTracks error:", error);
    return { loadType: "empty", data: [] };
  }
}

export async function decodeTrack(
  encoded: string,
): Promise<LavalinkTrack | null> {
  try {
    return await $fetch<LavalinkTrack>(`${baseUrl}/v4/decodetrack`, {
      headers,
      params: { track: encoded },
    });
  } catch (error) {
    console.error("[Lavalink] decodeTrack error:", error);
    return null;
  }
}

export async function decodeTracks(
  body: string[],
): Promise<LavalinkTrack[] | null> {
  try {
    return await $fetch<LavalinkTrack[]>(`${baseUrl}/v4/decodetracks`, {
      method: "POST",
      headers,
      body,
    });
  } catch (error) {
    console.error("[Lavalink] decodeTracks error:", error);
    return null;
  }
}
