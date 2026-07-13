import { or, eq } from "drizzle-orm";

import { db, tables } from "../../utils/drizzle";
import { asObject, requiredString } from "../../utils/validation";

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
              login: { type: "string", description: "Username or email address" },
              password: { type: "string", format: "password" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Login successful" },
      400: { description: "Invalid fields" },
      401: { description: "Invalid credentials" },
    },
  },
});

export default defineEventHandler(async (event) => {
  const body = asObject((await readBody(event)) ?? {});
  const login = requiredString(body.login, "login", 320).toLowerCase();
  if (typeof body.password !== "string" || !body.password || body.password.length > 1024) {
    throw createError({
      statusCode: 400,
      statusMessage: "password is required and must be at most 1024 characters",
    });
  }

  const user = db
    .select()
    .from(tables.users)
    .where(or(eq(tables.users.email, login), eq(tables.users.username, login)))
    .limit(1)
    .get();
  if (!user || !(await verifyPassword(user.passwordHash, body.password))) {
    throw createError({ statusCode: 401, statusMessage: "Invalid credentials" });
  }

  await setUserSession(event, {
    user: {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      theme: user.theme,
    },
  });
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    avatar: user.avatar,
    theme: user.theme,
    createdAt: user.createdAt,
  };
});
