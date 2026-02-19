export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const sessionUser = session.user as any;
  const user = await db
    .select()
    .from(tables.users)
    .where(eq(tables.users.id, sessionUser.id))
    .limit(1);

  if (!user.length) {
    throw createError({
      statusCode: 404,
      statusMessage: "User not found",
    });
  }

  return user;
});
