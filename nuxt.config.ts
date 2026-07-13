import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/eslint", "@nuxt/icon", "nuxt-auth-utils"],
  nitro: {
    experimental: {
      openAPI: true,
    },
    openAPI: {
      meta: {
        description: "REST API for Songascribe",
        title: "Songascribe API",
        version: "0.1.0",
      },
      production: "runtime",
      route: "/api/_openapi.json",
      ui: {
        scalar: {
          defaultOpenAllTags: true,
          expandAllModelSections: true,
          expandAllResponses: true,
          layout: "classic",
          persistAuth: true,
          route: "/api/",
          showDeveloperTools: "never",
          telemetry: false,
          theme: "deepSpace",
        },
        swagger: false,
      },
    },
  },
  css: ["~/assets/app.css"],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ["@vue/devtools-core", "@vue/devtools-kit"],
    },
  },
  runtimeConfig: {
    databasePath: process.env.DATABASE_PATH || "./sqlite.db",
    nodelink: {
      host: process.env.NODELINK_HOST || "localhost",
      port: parseInt(process.env.NODELINK_PORT || "2333", 10),
      password: process.env.NODELINK_PASSWORD || "youshallnotpass",
      timeoutMs: parseInt(process.env.NODELINK_TIMEOUT_MS || "8000", 10),
    },
  },
});
