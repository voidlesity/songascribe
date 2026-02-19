import tailwindcss from "@tailwindcss/vite";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/eslint", "@nuxt/icon", "nuxt-auth-utils"],
  css: ["~/assets/app.css"],
  vite: {
    plugins: [tailwindcss()],
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
