import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: [
    "@nuxt/eslint",
    "@nuxt/icon",
    "@nuxt/image",
    "@pinia/nuxt",
    "pinia-plugin-persistedstate",
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  css: ["~/assets/app.css"],
});
