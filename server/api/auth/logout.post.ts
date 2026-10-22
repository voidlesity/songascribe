defineRouteMeta({
  openAPI: {
    tags: ["Auth"],
    summary: "Logout",
    description: "Clear the current user session.",
    responses: {
      204: { description: "Logged out" },
    },
  },
});

export default defineEventHandler(async (event) => {
  await clearUserSession(event);
  return sendNoContent(event);
});
