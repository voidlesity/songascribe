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
    "nuxt-lodash",
    "nuxt-auth-utils",
  ],
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
  css: ["~/assets/app.css"],
});
