defineRouteMeta({
  openAPI: {
    tags: ["Lavalink"],
    summary: "Resolve audio stream",
    description:
      "Resolves a Lavalink encoded track ID to its streamable URI and metadata.",
    parameters: [
      {
        in: "query",
        name: "trackId",
        required: true,
        schema: { type: "string" },
        description: "Base64-encoded Lavalink track ID",
      },
    ],
    responses: {
      200: {
        description: "Resolved track info",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                sourceName: { type: "string" },
                uri: { type: "string" },
                identifier: { type: "string" },
                encoded: { type: "string" },
                info: { type: "object" },
              },
            },
          },
        },
      },
      400: { description: "Missing trackId" },
      404: { description: "Track not found" },
      500: { description: "Lavalink error" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const { trackId } = getQuery(event);

  if (!trackId || typeof trackId !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: 'Encoded track ID "trackId" is required',
    });
  }

  const config = useRuntimeConfig();
  const baseUrl: string = `http://${config.lavalink.host}:${config.lavalink.port}`;
  const password: string = config.lavalink.password as string;

  try {
    // First decode the track to get info
    const trackInfo = await $fetch<{
      info?: {
        uri?: string;
        identifier?: string;
        sourceName?: string;
        title?: string;
        author?: string;
        length?: number;
        artworkUrl?: string;
      };
    }>(`${baseUrl}/v4/decodetrack`, {
      headers: { Authorization: password },
      params: { track: trackId },
    });

    if (!trackInfo?.info?.uri) {
      throw createError({
        statusCode: 404,
        statusMessage: "Could not resolve track URI",
      });
    }

    // Use Lavalink's loadtracks endpoint to get the track
    const loadResult = await $fetch<{
      loadType: string;
      data:
        | Array<{ encoded: string; info: Record<string, unknown> }>
        | {
            encoded?: string;
            info?: Record<string, unknown>;
            tracks?: Array<{ encoded: string; info: Record<string, unknown> }>;
          };
    }>(`${baseUrl}/v4/loadtracks`, {
      headers: { Authorization: password },
      params: { identifier: trackInfo.info.uri },
    });

    let resolvedTrack: {
      encoded: string;
      info: Record<string, unknown>;
    } | null = null;

    if (loadResult.loadType === "track" && !Array.isArray(loadResult.data)) {
      resolvedTrack = loadResult.data as {
        encoded: string;
        info: Record<string, unknown>;
      };
    } else if (
      loadResult.loadType === "search" &&
      Array.isArray(loadResult.data) &&
      loadResult.data.length > 0
    ) {
      resolvedTrack = loadResult.data[0] ?? null;
    } else if (
      loadResult.loadType === "playlist" &&
      !Array.isArray(loadResult.data) &&
      loadResult.data?.tracks &&
      loadResult.data.tracks.length > 0
    ) {
      resolvedTrack = loadResult.data.tracks[0] ?? null;
    }

    if (!resolvedTrack) {
      throw createError({
        statusCode: 404,
        statusMessage: "Track could not be loaded",
      });
    }

    const resolvedInfo = (resolvedTrack.info || {}) as Record<string, unknown>;
    const trackInfoData = trackInfo.info;

    const sourceName: string =
      (resolvedInfo.sourceName as string) ||
      trackInfoData.sourceName ||
      "unknown";
    const uri: string = (resolvedInfo.uri as string) || trackInfoData.uri || "";
    const identifier: string =
      (resolvedInfo.identifier as string) || trackInfoData.identifier || "";

    return {
      sourceName,
      uri,
      identifier,
      encoded: resolvedTrack.encoded || trackId,
      info: resolvedInfo || trackInfoData,
    };
  } catch (error: unknown) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error("[Lavalink Stream] Error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to resolve audio stream",
    });
  }
});
