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
    artworkUrl?: string;
    isrc?: string;
  };
  pluginInfo: any;
}

interface SearchResult {
  loadType: "track" | "playlist" | "search" | "empty" | "error";
  data: {
    encoded?: string;
    info?: any;
    tracks?: LavalinkTrack[];
    playlistInfo?: {
      name: string;
      selectedTrack: number;
    };
  };
  exception?: {
    message: string;
    severity: string;
  };
}

function getLavalinkConfig() {
  const config = useRuntimeConfig();
  return {
    host: config.lavalink.host || "localhost",
    port: config.lavalink.port || 2333,
    password: config.lavalink.password || "youshallnotpass",
  };
}

function getLavalinkUrl() {
  const config = getLavalinkConfig();
  return `http://${config.host}:${config.port}`;
}

export async function searchTracks(query: string): Promise<LavalinkTrack[]> {
  const config = getLavalinkConfig();
  const baseUrl = getLavalinkUrl();

  // Search YouTube Music by default for best music results
  const searchQuery = query.startsWith("http") ? query : `ytmsearch:${query}`;

  try {
    const result = await $fetch<SearchResult>(`${baseUrl}/v4/loadtracks`, {
      headers: {
        Authorization: config.password,
      },
      params: {
        identifier: searchQuery,
      },
    });

    if (result.loadType === "error" || result.loadType === "empty") {
      return [];
    }

    if (result.loadType === "track" && result.data.encoded) {
      // Single track result
      return [
        {
          encoded: result.data.encoded,
          info: result.data.info,
          pluginInfo: {},
        },
      ];
    }

    if (result.loadType === "search" || result.loadType === "playlist") {
      return result.data.tracks || [];
    }

    return [];
  } catch (error) {
    console.error("Error searching tracks:", error);
    return [];
  }
}

export async function getTrackInfo(
  trackIdOrUrl: string,
): Promise<LavalinkTrack | null> {
  const config = getLavalinkConfig();
  const baseUrl = getLavalinkUrl();

  try {
    const result = await $fetch<SearchResult>(`${baseUrl}/v4/loadtracks`, {
      headers: {
        Authorization: config.password,
      },
      params: {
        identifier: trackIdOrUrl,
      },
    });

    if (result.loadType === "track" && result.data.encoded) {
      return {
        encoded: result.data.encoded,
        info: result.data.info,
        pluginInfo: {},
      };
    }

    if (
      result.loadType === "search" &&
      result.data.tracks &&
      result.data.tracks.length > 0
    ) {
      return result.data.tracks[0];
    }

    return null;
  } catch (error) {
    console.error("Error getting track info:", error);
    return null;
  }
}

export async function resolveTrackFromISRC(
  isrc: string,
): Promise<LavalinkTrack | null> {
  try {
    // Try searching with ISRC on different sources
    const searchQuery = `ytmsearch:${isrc}`;
    const tracks = await searchTracks(searchQuery);

    if (tracks.length > 0) {
      // Try to find exact match by ISRC
      const exactMatch = tracks.find((t) => t.info.isrc === isrc);
      return exactMatch || tracks[0];
    }

    return null;
  } catch (error) {
    console.error("Error resolving ISRC:", error);
    return null;
  }
}

export function formatTrackForDatabase(track: LavalinkTrack) {
  return {
    track_id: track.encoded,
    name: track.info.title,
    artist: track.info.author,
    album: null, // Lavalink doesn't provide album info directly
    album_art: track.info.artworkUrl || null,
    duration: track.info.length,
    url: track.info.uri,
    source: track.info.sourceName,
    isrc: track.info.isrc || null,
  };
}

export { LavalinkTrack, SearchResult };
