import tailwindcss from "@tailwindcss/vite";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/eslint", "nuxt-auth-utils", "@nuxt/icon"],
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
    "build:before"() {
      const db = drizzle("./sqlite.db");
      migrate(db, { migrationsFolder: "./server/db/migrations" });
    },
  },
});
