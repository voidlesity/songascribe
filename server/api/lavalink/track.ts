export default defineEventHandler(async (event) => {
  const { trackId } = getQuery(event);

  if (!trackId || typeof trackId !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: 'Encoded track ID "trackId" is required',
    });
  }

  return await decodeTrack(trackId);
});
