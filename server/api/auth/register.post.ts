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
            required: ["email", "password", "name"],
            properties: {
              email: { type: "string", format: "email" },
              password: { type: "string", format: "password" },
              name: { type: "string" },
              avatar: { type: "string", nullable: true },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Registration successful",
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
      409: { description: "Email or username already taken" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  // Validate input
  if (!body.email || !body.password || !body.name) {
    throw createError({
      statusCode: 400,
      message: "Email, password, and name are required",
    });
  }

  // Check if user already exists
  const existingUser = await db
    .select()
    .from(tables.users)
    .where(
      or(
        eq(tables.users.email, body.email.toLowerCase()),
        eq(tables.users.name, body.name.toLowerCase()),
      ),
    )
    .limit(1);

  if (existingUser.length > 0) {
    throw createError({
      statusCode: 409,
      message: "User with this email or username already exists",
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
