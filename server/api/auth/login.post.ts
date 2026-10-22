defineRouteMeta({
  openAPI: {
    tags: ["Auth"],
    summary: "Login",
    description: "Authenticates with username or email and password.",
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
  const body = await readObjectBody(event);
  const login = requiredString(body.login, "login", 320).toLowerCase();
  const password = requiredPassword(body.password);

  const user = db
    .select()
    .from(tables.users)
    .where(or(eq(tables.users.email, login), eq(tables.users.username, login)))
    .get();
  if (!user || !(await verifyPassword(user.passwordHash, password))) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid credentials",
    });
  }

  await setSessionUser(event, user);
  return serializeUser(user);
});
