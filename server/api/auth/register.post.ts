export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  // Validate input
  if (!body.email || !body.password || !body.name) {
    throw createError({
      statusCode: 400,
      message: "Email, password, and name are required",
    });
  }

  // Validate email format
  if (!validateEmail(body.email)) {
    throw createError({
      statusCode: 400,
      message: "Invalid email format",
    });
  }

  // Check if user already exists
  const existingUser = await db
    .select()
    .from(tables.users)
    .where(eq(tables.users.email, body.email.toLowerCase()))
    .limit(1);

  if (existingUser.length > 0) {
    throw createError({
      statusCode: 409,
      message: "User with this email already exists",
    });
  }

  // Hash password
  const passwordHash = await hashPassword(body.password);

  // Create user
  const [newUser] = await db
    .insert(tables.users)
    .values({
      email: body.email.toLowerCase(),
      password_hash: passwordHash,
      name: body.name,
      avatar: body.avatar || null,
      theme: "dark",
      created_at: new Date(),
    })
    .returning();

  // Set user session
  await setUserSession(event, {
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      avatar: newUser.avatar,
      theme: newUser.theme,
    },
  });

  return {
    success: true,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      avatar: newUser.avatar,
      theme: newUser.theme,
    },
  };
});
