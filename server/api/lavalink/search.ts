export default defineEventHandler(async (event) => {
  const { q } = getQuery(event);

  if (!q || typeof q !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: 'Search query "q" is required',
    });
  }

  return await searchTracks(q);
});
