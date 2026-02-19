export default defineEventHandler(async (event) => {
  const { id } = getQuery(event);

  if (!id || typeof id !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: 'Encoded track ID "id" is required',
    });
  }

  const track = await decodeTrack(id);

  if (!track) {
    throw createError({
      statusCode: 404,
      statusMessage: "Track not found",
    });
  }

  return {
    id: track.info.identifier,
    trackId: track.encoded,
    name: track.info.title,
    artist: track.info.author,
    albumArt: track.info.artworkUrl ?? null,
    duration: track.info.length,
    url: track.info.uri,
    source: track.info.sourceName,
    isrc: track.info.isrc ?? null,
  };
});
