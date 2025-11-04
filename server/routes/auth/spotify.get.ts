export default defineOAuthSpotifyEventHandler({
  async onSuccess(event, { user, tokens }) {
    const test = await db
      .insert(tables.users)
      .values({
        id: user.id,
        name: user.display_name,
        avatar: user.images[0].url,
      })
      .onConflictDoUpdate({
        target: tables.users.id,
        set: { name: user.display_name, avatar: user.images[0].url },
      })
      .returning();
    console.log(test);
    await setUserSession(event, {
      user: test,
      tokens: tokens,
    });
    return sendRedirect(event, "/");
  },
  onError(event, error) {
    console.error("Spotify OAuth error:", error);
    return sendRedirect(event, "/");
  },
});
