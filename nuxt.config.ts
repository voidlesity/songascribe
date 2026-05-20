import tailwindcss from "@tailwindcss/vite";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/eslint", "@nuxt/icon", "nuxt-auth-utils"],
  nitro: {
    experimental: {
      openAPI: true,
    },
    openAPI: {
      production: "runtime",
      route: "/api/openapi.json",
      ui: {
        scalar: { route: "/api/" },
        swagger: { route: "/api/_swagger" },
      },
      meta: {
        title: "Songascribe API",
        description: "REST API for Songascribe",
        version: "0.1.0",
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
    lavalink: {
      host: process.env.LAVALINK_HOST || "localhost",
      port: parseInt(process.env.LAVALINK_PORT || "2333"),
      password: process.env.LAVALINK_PASSWORD || "youshallnotpass",
    },
  },
  hooks: {
    "build:before"() {
      const db = drizzle("./sqlite.db");
      migrate(db, { migrationsFolder: "./server/db/migrations" });
    },
  },
});
