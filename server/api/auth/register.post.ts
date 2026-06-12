defineRouteMeta({
  openAPI: {
    tags: ["Auth"],
    summary: "Register",
    description: "Create a new user account and start a session.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["email", "username", "password"],
            properties: {
              email: { type: "string", format: "email" },
              username: { type: "string" },
              password: { type: "string", format: "password" },
              avatar: { type: "string", nullable: true },
            },
          },
        },
      },
    },
    responses: {
      201: { description: "User created" },
      400: { description: "Missing or invalid fields" },
      409: { description: "Email or username already taken" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const body = ((await readBody<{
    email?: string;
    username?: string;
    password?: string;
    avatar?: string | null;
  }>(event)) ?? {}) as {
    email?: string;
    username?: string;
    password?: string;
    avatar?: string | null;
  };

  const email = body.email?.trim().toLowerCase();
  const username = body.username?.trim().toLowerCase();
  const password = body.password;

  if (!email || !username || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: "email, username and password are required",
    });
  }
  if (!/^[a-z0-9_.-]{3,32}$/.test(username)) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "username must be 3-32 chars, lowercase letters/digits/._- only",
    });
  }

  const existing = await db
    .select()
    .from(tables.users)
    .where(
      or(eq(tables.users.email, email), eq(tables.users.username, username)),
    )
    .limit(1);

  if (existing.length > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: "Email or username already in use",
    });
  }

  const passwordHash = await hashPassword(password);
  const now = new Date();
  const [user] = await db
    .insert(tables.users)
    .values({
      email,
      username,
      passwordHash,
      avatar: body.avatar ?? null,
      theme: "dark",
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  await setUserSession(event, {
    user: {
      id: user!.id,
      username: user!.username,
      avatar: user!.avatar,
      theme: user!.theme,
    },
  });

  setResponseStatus(event, 201);
  return {
    id: user!.id,
    email: user!.email,
    username: user!.username,
    avatar: user!.avatar,
    theme: user!.theme,
    createdAt: user!.createdAt,
  };
});
