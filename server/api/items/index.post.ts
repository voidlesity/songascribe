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
        item: newItem?.id,
        song: song?.id,
      });
    }
  }

  return newItem;
});
