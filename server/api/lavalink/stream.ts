export default defineEventHandler(async (event) => {
  const { trackId } = getQuery(event);

  if (!trackId || typeof trackId !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: 'Encoded track ID "trackId" is required',
    });
  }

  const track = await decodeTrack(trackId);

  if (!track) {
    throw createError({
      statusCode: 404,
      statusMessage: "Track not found",
    });
  }

  return {
    trackId: track.encoded,
    streamUrl: track.info.uri,
    duration: track.info.length,
    name: track.info.title,
    artist: track.info.author,
    artworkUrl: track.info.artworkUrl ?? null,
  };
});
