export default defineEventHandler(async (event) => {
  const { id } = getQuery(event);

  if (!id || typeof id !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Track ID "id" is required',
    });
  }

  try {
    const track = await getTrackInfo(id);

    if (!track) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Track not found',
      });
    }

    // Format track for frontend consumption
    return {
      id: track.info.identifier,
      trackId: track.track,
      name: track.info.title,
      artist: track.info.author,
      album: null,
      albumArt: track.info.artworkUrl || null,
      duration: track.info.length,
      url: track.info.uri,
      source: track.info.sourceName,
      isrc: track.info.isrc || null,
    };
  } catch (error) {
    console.error('Error fetching track:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Error while fetching track information',
    });
  }
});
