let accessToken: string = "";
let tokenExpiry = 0;

// Function to get a new access token from Spotify
async function getSpotifyToken(config: any) {
  const response: any = await $fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        btoa(
          config.oauth.spotify.clientId +
            ":" +
            config.oauth.spotify.clientSecret,
        ),
    },
    body: "grant_type=client_credentials",
  });
  accessToken = response.access_token;
  tokenExpiry = Date.now() + response.expires_in * 1000;
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const { id } = getQuery(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Track ID "id" is required',
    });
  }

  // Check if token is invalid or expired
  if (!accessToken || Date.now() > tokenExpiry) {
    try {
      await getSpotifyToken(config);
    } catch (error) {
      console.error("Error fetching Spotify token:", error);
      throw createError({
        statusCode: 500,
        statusMessage: "Could not authenticate with Spotify.",
      });
    }
  }

  // Get track details using the access token
  try {
    const track: any = await $fetch(`https://api.spotify.com/v1/tracks/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return {
      id: track.id,
      name: track.name,
      artist: track.artists.map((a: any) => a.name).join(", "),
      album: track.album.name,
      albumArt: track.album.images[0]?.url || null,
      duration: track.duration_ms,
      previewUrl: track.preview_url,
      spotifyUrl: track.external_urls.spotify,
      releaseDate: track.album.release_date,
      popularity: track.popularity,
    };
  } catch (error) {
    console.error("Error fetching track from Spotify:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Error while fetching track from Spotify.",
    });
  }
});
