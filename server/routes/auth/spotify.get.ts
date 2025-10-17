export default defineOAuthSpotifyEventHandler({
  async onSuccess(event, { user, tokens }) {
    await setUserSession(event, {
      user: user,
      tokens: tokens,
    });
    return sendRedirect(event, "/");
  },
  onError(event, error) {
    console.error("Spotify OAuth error:", error);
    return sendRedirect(event, "/");
  },
});
