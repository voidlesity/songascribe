export default defineEventHandler(async (event) => {
  const { q } = getQuery(event);

  if (!q || typeof q !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Search query "q" is required',
    });
  }

  try {
    const tracks = await searchTracks(q);

    // Format tracks for frontend consumption
    const formattedTracks = tracks.slice(0, 10).map((track) => ({
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
    }));

    return formattedTracks;
  } catch (error) {
    console.error('Error searching tracks:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Error while searching for tracks',
    });
  }
});
