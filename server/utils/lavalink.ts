const config = useRuntimeConfig();
const baseUrl = `http://${config.lavalink.host}:${config.lavalink.port}`;
const headers = { Authorization: config.lavalink.password };

interface LavalinkTrack {
  encoded: string;
  info: {
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
  };
  pluginInfo: any;
  userData: any;
}

interface LavalinkSearch {
  loadType: string;
  data: LavalinkTrack[];
}

export async function searchTracks<LavalinkSearch>(query: string) {
  const identifier = query.startsWith("http") ? query : `ytmsearch:${query}`;

  try {
    const result: any = await $fetch<Promise<LavalinkSearch>>(
      `${baseUrl}/v4/loadtracks`,
      {
        headers,
        params: { identifier },
      },
    );
    return result.data;
  } catch (error) {
    console.error("[Lavalink] searchTracks error:", error);
    return [];
  }
}

export async function decodeTrack<LavalinkTrack>(encoded: string) {
  try {
    return await $fetch(`${baseUrl}/v4/decodetrack`, {
      headers,
      params: { track: encoded },
    });
  } catch (error) {
    console.error("[Lavalink] decodeTrack error:", error);
    return null;
  }
}

export async function decodeTracks(body: string[]) {
  try {
    return await $fetch(`${baseUrl}/v4/decodetracks`, {
      method: "POST",
      headers,
      body,
    });
  } catch (error) {
    console.error("[Lavalink] decodeTrack error:", error);
    return null;
  }
}
