// Helper function to extract track ID from URL or use direct track ID
function extractTrackId(urlOrId: string): string | null {
  // If it's already a Lavalink track ID (base64 encoded), return it
  if (!urlOrId.includes("://")) {
    return urlOrId;
  }

  // For URLs, we'll search for the track later
  return null;
}

// Helper function to fetch track info from Lavalink
async function fetchLavalinkTrackInfo(query: string) {
  try {
    // If it's a URL, search directly
    if (query.startsWith("http")) {
      const tracks = await searchTracks(query);
      return tracks.length > 0 ? tracks[0] : null;
    }

    // If it's a track ID, get info directly
    const trackInfo = await getTrackInfo(query);
    return trackInfo;
  } catch (error) {
    console.error("Error fetching Lavalink track info:", error);
    return null;
  }
}

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

    // Add new songs
    for (const songData of body.songs) {
      const trackId = extractTrackId(songData.url || songData.trackId);

      // Check if song already exists by track ID or URL
      let song = trackId
        ? db
            .select()
            .from(tables.songs)
            .where(eq(tables.songs.track_id, trackId))
            .get()
        : db
            .select()
            .from(tables.songs)
            .where(eq(tables.songs.url, songData.url))
            .get();

      // Create song if it doesn't exist
      if (!song) {
        // Fetch full track info from Lavalink
        let trackInfo = null;
        if (trackId) {
          trackInfo = await fetchLavalinkTrackInfo(trackId);
        } else if (songData.url) {
          trackInfo = await fetchLavalinkTrackInfo(songData.url);
        }

        const trackData = trackInfo ? formatTrackForDatabase(trackInfo) : null;

        const [newSong] = await db
          .insert(tables.songs)
          .values({
            track_id: trackData?.track_id || trackId,
            name: trackData?.name || songData.name,
            artist: trackData?.artist || songData.artist,
            album: trackData?.album || null,
            album_art: trackData?.album_art || null,
            duration: trackData?.duration || null,
            url: trackData?.url || songData.url,
            source: trackData?.source || null,
            isrc: trackData?.isrc || null,
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
