// Helper function to extract Spotify ID from URL
function extractSpotifyId(url: string): string | null {
  const match = url.match(/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

// Helper function to fetch track info from Spotify
async function fetchSpotifyTrackInfo(spotifyId: string) {
  try {
    const trackInfo = await $fetch(`/api/spotify/track?id=${spotifyId}`, {
      baseURL: "",
    });
    return trackInfo;
  } catch (error) {
    console.error("Error fetching Spotify track info:", error);
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
      const spotifyId = extractSpotifyId(songData.url);

      // Check if song already exists by Spotify ID or URL
      let song = spotifyId
        ? db
            .select()
            .from(tables.songs)
            .where(eq(tables.songs.spotify_id, spotifyId))
            .get()
        : db
            .select()
            .from(tables.songs)
            .where(eq(tables.songs.url, songData.url))
            .get();

      // Create song if it doesn't exist
      if (!song) {
        // Fetch full track info from Spotify if we have an ID
        let trackInfo = null;
        if (spotifyId) {
          trackInfo = await fetchSpotifyTrackInfo(spotifyId);
        }

        const [newSong] = await db
          .insert(tables.songs)
          .values({
            spotify_id: spotifyId,
            name: trackInfo?.name || songData.name,
            artist: trackInfo?.artist || songData.artist,
            album: trackInfo?.album || null,
            album_art: trackInfo?.albumArt || null,
            duration: trackInfo?.duration || null,
            preview_url: trackInfo?.previewUrl || null,
            url: songData.url,
            release_date: trackInfo?.releaseDate || null,
            popularity: trackInfo?.popularity || null,
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
