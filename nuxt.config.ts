import tailwindcss from "@tailwindcss/vite";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/eslint", "@nuxt/icon", "@nuxt/image", "nuxt-auth-utils"],
  css: ["~/assets/app.css"],
  vite: {
    plugins: [tailwindcss()],
  },
  runtimeConfig: {
    oauth: {
      spotify: {
        clientId: "",
        clientSecret: "",
      },
    },
  },
  hooks: {
    async "build:before"() {
      const db = drizzle("./sqlite.db");
      await migrate(db, { migrationsFolder: "./server/db/migrations" });
    },
  },
});
