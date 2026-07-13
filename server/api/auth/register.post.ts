import { eq, or } from "drizzle-orm";

import { db, tables } from "../../utils/drizzle";
import { asObject, requiredString } from "../../utils/validation";

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
              username: { type: "string" },
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
  const body = asObject((await readBody(event)) ?? {});
  const email = requiredString(body.email, "email", 320).toLowerCase();
  const username = requiredString(body.username, "username", 32).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, statusMessage: "email is invalid" });
  }
  if (!/^[a-z0-9_.-]{3,32}$/.test(username)) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "username must be 3-32 chars, lowercase letters/digits/._- only",
    });
  }
  if (typeof body.password !== "string" || !body.password || body.password.length > 1024) {
    throw createError({
      statusCode: 400,
      statusMessage: "password is required and must be at most 1024 characters",
    });
  }

  const existing = db
    .select({ id: tables.users.id })
    .from(tables.users)
    .where(or(eq(tables.users.email, email), eq(tables.users.username, username)))
    .limit(1)
    .get();
  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: "Email or username already in use",
    });
  }

  const passwordHash = await hashPassword(body.password);
  const now = new Date();
  let user: typeof tables.users.$inferSelect;
  try {
    user = db
      .insert(tables.users)
      .values({
        email,
        username,
        passwordHash,
        avatar: null,
        theme: "dark",
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      String(error.code).startsWith("SQLITE_CONSTRAINT")
    ) {
      throw createError({
        statusCode: 409,
        statusMessage: "Email or username already in use",
      });
    }
    console.error("[auth] registration failed", error);
    throw createError({ statusCode: 500, statusMessage: "Could not create account" });
  }

  await setUserSession(event, {
    user: {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      theme: user.theme,
    },
  });
  setResponseStatus(event, 201);
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    avatar: user.avatar,
    theme: user.theme,
    createdAt: user.createdAt,
  };
});
