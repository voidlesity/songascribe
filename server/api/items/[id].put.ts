export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const itemId = parseInt(getRouterParam(event, "id") || "0");
  const body = await readBody(event);

  if (!itemId) {
    throw createError({
      statusCode: 400,
      message: "Invalid item ID",
    });
  }

  // Get the item and verify it belongs to a category owned by the user
  const item = db
    .select({
      item: tables.items,
      category: tables.categories,
    })
    .from(tables.items)
    .leftJoin(
      tables.categories,
      eq(tables.items.categorie, tables.categories.id),
    )
    .where(eq(tables.items.id, itemId))
    .get();

  if (!item || item.category?.user !== user.id) {
    throw createError({
      statusCode: 404,
      message: "Item not found",
    });
  }

  // Update the item name if provided
  if (body.name) {
    await db
      .update(tables.items)
      .set({ name: body.name })
      .where(eq(tables.items.id, itemId));
  }

  // Update songs if provided
  if (body.songs && Array.isArray(body.songs)) {
    // Remove existing song mappings
    await db.delete(tables.songsMap).where(eq(tables.songsMap.item, itemId));

    // Re-add songs
    for (const songData of body.songs) {
      const queryKey: string = songData.trackId || songData.url;
      if (!queryKey) continue;

      // Check if song already exists in the DB
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
        item: itemId,
        song: song?.id,
      });
    }
  }

  return { success: true };
});
