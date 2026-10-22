import type { H3Event } from "h3";

type UserRow = typeof tables.users.$inferSelect;

export function serializeUser(user: UserRow) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    avatar: user.avatar,
    theme: user.theme,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/** Store the fields the client needs in the (cookie) session. */
export function setSessionUser(event: H3Event, user: UserRow) {
  return setUserSession(event, {
    user: {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      theme: user.theme,
    },
  });
}
