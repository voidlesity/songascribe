let accessToken = null;
let tokenExpiry = 0;

// Function to get a new access token from Spotify
async function getSpotifyToken(config) {
  const response = await $fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        btoa(config.spotify.clientId + ":" + config.spotify.clientSecret),
    },
    body: "grant_type=client_credentials",
  });
  accessToken = response.access_token;
  tokenExpiry = Date.now() + response.expires_in * 1000;
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const { q } = getQuery(event);

  if (!q) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Search query "q" is required',
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

  // Search for tracks using the access token
  try {
    const searchResults = await $fetch(`https://api.spotify.com/v1/search`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        q,
        type: "track",
        limit: 10,
      },
    });
    return searchResults.tracks.items;
  } catch (error) {
    console.error("Error searching Spotify:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Error while searching on Spotify.",
    });
  }
});
