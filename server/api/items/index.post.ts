export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const body = await readBody(event);

  if (!body.name || !body.categoryId) {
    throw createError({
      statusCode: 400,
      message: "Item name and category ID are required",
    });
  }

  // Verify the category belongs to the user
  const category = db
    .select()
    .from(tables.categories)
    .where(
      and(
        eq(tables.categories.id, body.categoryId),
        eq(tables.categories.user, user.id),
      ),
    )
    .get();

  if (!category) {
    throw createError({
      statusCode: 404,
      message: "Category not found",
    });
  }

  // Create the item
  const [newItem] = await db
    .insert(tables.items)
    .values({
      categorie: body.categoryId,
      name: body.name,
    })
    .returning();

  // Add songs if provided
  if (body.songs && Array.isArray(body.songs)) {
    for (const songData of body.songs) {
      const queryKey: string = songData.trackId || songData.url;
      if (!queryKey) continue;

      // Check if song already exists
      let song = songData.trackId
        ? db
            .select()
            .from(tables.songs)
            .where(eq(tables.songs.track_id, songData.trackId))
            .get()
        : db
            .select()
            .from(tables.songs)
            .where(eq(tables.songs.url, songData.url))
            .get();

      // Create song if it doesn't exist in the DB yet
      if (!song) {
        const trackInfo = await resolveTrack(queryKey);
        const trackData = trackInfo ? formatTrackForDatabase(trackInfo) : null;

        const [newSong] = await db
          .insert(tables.songs)
          .values({
            track_id: trackData?.track_id ?? songData.trackId ?? null,
            name: trackData?.name ?? songData.name ?? null,
            artist: trackData?.artist ?? songData.artist ?? null,
            image: trackData?.image ?? null,
            duration: trackData?.duration ?? null,
            url: trackData?.url ?? songData.url ?? null,
            source: trackData?.source ?? null,
          })
          .returning();

        song = newSong;
      }

      // Link song to item
      await db.insert(tables.songsMap).values({
        item: newItem?.id,
        song: song?.id,
      });
    }
  }

  return newItem;
});
