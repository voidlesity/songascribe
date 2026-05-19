defineRouteMeta({
  openAPI: {
    tags: ["Auth"],
    summary: "Logout",
    description: "Clear the current user session.",
    responses: {
      200: {
        description: "Logout successful",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                message: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
});

export default defineEventHandler(async (event) => {
  await clearUserSession(event);

  return {
    success: true,
    message: "Logged out successfully",
  };
});
