export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  // Validate input
  if (!body.email || !body.password) {
    throw createError({
      statusCode: 400,
      message: "Email and password are required",
    });
  }

  // Find user by email
  const users = await db
    .select()
    .from(tables.users)
    .where(eq(tables.users.email, body.email.toLowerCase()))
    .limit(1);

  if (users.length === 0) {
    throw createError({
      statusCode: 401,
      message: "Invalid email or password",
    });
  }

  const user = users[0];

  // Verify password
  const isValidPassword = await verifyPassword(
    body.password,
    user.password_hash,
  );

  if (!isValidPassword) {
    throw createError({
      statusCode: 401,
      message: "Invalid email or password",
    });
  }

  // Set user session
  await setUserSession(event, {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      theme: user.theme,
    },
  });

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      theme: user.theme,
    },
  };
});
