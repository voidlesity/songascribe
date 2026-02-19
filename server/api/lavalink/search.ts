export default defineEventHandler(async (event) => {
  const { q } = getQuery(event);

  if (!q || typeof q !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: 'Search query "q" is required',
    });
  }

  const tracks = await searchTracks(q);

  return tracks.slice(0, 10).map((track) => ({
    id: track.info.identifier,
    trackId: track.encoded,
    name: track.info.title,
    artists: [{ name: track.info.author }],
    albumArt: track.info.artworkUrl ?? null,
    duration: track.info.length,
    url: track.info.uri,
    source: track.info.sourceName,
    isrc: track.info.isrc ?? null,
  }));
});
