import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: process.env.NODE_ENV === "development" },
  modules: [
    "@nuxt/eslint",
    "@nuxt/icon",
    "@nuxt/image",
    "@pinia/nuxt",
    "pinia-plugin-persistedstate",
    "@formkit/auto-animate",
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
