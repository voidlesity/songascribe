export default defineEventHandler(async (event) => {
  const { trackId } = getQuery(event);

  if (!trackId || typeof trackId !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: 'Track ID "trackId" is required',
    });
  }

  try {
    const track = await getTrackInfo(trackId);

    if (!track) {
      throw createError({
        statusCode: 404,
        statusMessage: "Track not found",
      });
    }

    // Return the track information with streaming URL
    // The track.track is the encoded track string that can be used for playback
    return {
      trackId: track.track,
      streamUrl: track.info.uri,
      duration: track.info.length,
      name: track.info.title,
      artist: track.info.author,
      artworkUrl: track.info.artworkUrl || null,
    };
  } catch (error) {
    console.error("Error getting stream URL:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Error while getting stream URL",
    });
  }
});
