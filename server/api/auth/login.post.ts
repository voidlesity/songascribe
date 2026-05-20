defineRouteMeta({
  openAPI: {
    tags: ["Auth"],
    summary: "Login",
    description: "Authenticate with username or email + password.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["login", "password"],
            properties: {
              login: {
                type: "string",
                description: "Username or email address",
              },
              password: { type: "string", format: "password" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Login successful" },
      400: { description: "Missing fields" },
      401: { description: "Invalid credentials" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const body = await readBody<{ login?: string; password?: string }>(event);
  const login = body.login?.trim().toLowerCase();
  const password = body.password;

  if (!login || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: "login and password are required",
    });
  }

  const [user] = await db
    .select()
    .from(tables.users)
    .where(or(eq(tables.users.email, login), eq(tables.users.username, login)))
    .limit(1);

  if (!user || !(await verifyPassword(user.passwordHash, password))) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid credentials",
    });
  }

  await setUserSession(event, { user: { id: user.id } });

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    theme: user.theme,
    createdAt: user.createdAt,
  };
});
