export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const body = await readBody(event);

  if (!body.theme) {
    throw createError({
      statusCode: 400,
      statusMessage: "Theme is required",
    });
  }

  const sessionUser = session.user as any;
  const updatedUser = await db
    .update(tables.users)
    .set({
      theme: body.theme,
    })
    .where(eq(tables.users.id_spotify, sessionUser.id_spotify))
    .returning();

  if (!updatedUser.length) {
    throw createError({
      statusCode: 404,
      statusMessage: "User not found",
    });
  }

  // Update the session with new user data
  await setUserSession(event, {
    user: updatedUser[0],
    tokens: session.tokens,
  });

  return updatedUser[0];
});
