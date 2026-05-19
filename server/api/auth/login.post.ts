defineRouteMeta({
  openAPI: {
    tags: ["Auth"],
    summary: "Login",
    description:
      "Authenticate with username/email and password. Sets a session cookie.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["usermail", "password"],
            properties: {
              usermail: {
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
      200: {
        description: "Login successful",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                user: {
                  type: "object",
                  properties: {
                    id: { type: "integer" },
                    email: { type: "string" },
                    name: { type: "string" },
                    avatar: { type: "string", nullable: true },
                    theme: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
      400: { description: "Missing required fields" },
      401: { description: "Invalid credentials" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  // Validate input
  if (!body.usermail || !body.password) {
    throw createError({
      statusCode: 400,
      message: "Username | Email and password are required",
    });
  }

  // Find user by username or email
  const users = await db
    .select()
    .from(tables.users)
    .where(
      or(
        eq(tables.users.email, body.usermail.toLowerCase()),
        eq(tables.users.name, body.usermail.toLowerCase()),
      ),
    )
    .limit(1);

  if (users.length === 0) {
    throw createError({
      statusCode: 401,
      message: "Invalid Username | Email password combination",
    });
  }

  const user = users[0];

  // Verify password
  const isValidPassword = await verifyPassword(
    user.password_hash,
    body.password,
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
