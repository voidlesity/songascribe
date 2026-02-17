export default defineOAuthSpotifyEventHandler({
  async onSuccess(event, { user: spotifyUser, tokens }) {
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(tables.users)
      .where(eq(tables.users.id_spotify, spotifyUser.id))
      .limit(1);

    let user;

    if (existingUser.length > 0) {
      // User exists, login
      user = existingUser[0];
    } else {
      // User doesn't exist, create new user
      const newUser = await db
        .insert(tables.users)
        .values({
          id_spotify: spotifyUser.id,
          name: spotifyUser.display_name,
          avatar: spotifyUser.images[0]?.url || "",
        })
        .returning();
      user = newUser[0];
    }

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
