defineRouteMeta({
  openAPI: {
    tags: ["Auth"],
    summary: "Register",
    description: "Creates a user account and starts a session.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["email", "username", "password"],
            properties: {
              email: { type: "string", format: "email" },
              username: {
                type: "string",
                description: "3-32 lowercase letters, digits, '.', '_' or '-'",
              },
              password: { type: "string", format: "password" },
            },
          },
        },
      },
    },
    responses: {
      201: { description: "User created" },
      400: { description: "Invalid fields" },
      409: { description: "Email or username already taken" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const body = await readObjectBody(event);
  const email = requiredString(body.email, "email", 320).toLowerCase();
  const username = requiredString(body.username, "username").toLowerCase();
  const password = requiredPassword(body.password);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    badRequest("email is invalid");
  }
  if (!/^[a-z0-9_.-]{3,32}$/.test(username)) {
    badRequest(
      "username must be 3-32 characters of lowercase letters, digits, '.', '_' or '-'",
    );
  }

  const passwordHash = await hashPassword(password);
  // No await between the check and the insert, so they can't interleave.
  const taken = db
    .select({ id: tables.users.id })
    .from(tables.users)
    .where(
      or(eq(tables.users.email, email), eq(tables.users.username, username)),
    )
    .get();
  if (taken) {
    throw createError({
      statusCode: 409,
      statusMessage: "Email or username already in use",
    });
  }

  const now = new Date();
  const user = db
    .insert(tables.users)
    .values({
      email,
      username,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  await setSessionUser(event, user);
  setResponseStatus(event, 201);
  return serializeUser(user);
});
