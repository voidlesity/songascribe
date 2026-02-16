export default defineOAuthSpotifyEventHandler({
  async onSuccess(event, { user, tokens }) {
    user = await db
      .insert(tables.users)
      .values({
        id_spotify: user.id,
        name: user.display_name,
        avatar: user.images[0].url,
      })
      .onConflictDoUpdate({
        target: tables.users.id_spotify,
        set: { name: user.display_name, avatar: user.images[0].url },
      })
      .returning();
    await setUserSession(event, {
      user: user[0],
      tokens: tokens,
    });
    return sendRedirect(event, "/");
  },
  onError(event, error) {
    console.error("Spotify OAuth error:", error);
    return sendRedirect(event, "/");
  },
});
