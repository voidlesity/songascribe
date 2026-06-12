import { defineNuxtRouteMiddleware, navigateTo } from "nuxt/app";

export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession();

  // If user is not logged in and not on login page already redirect to intro.
  if (to.name !== "login" && !loggedIn.value) {
    return navigateTo("/intro");
  }

  // If user is logged in and tries to go to login page, redirect to home.
  if (to.name === "login" && loggedIn.value) {
    return navigateTo("/");
  }
});
