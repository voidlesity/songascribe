import { defineNuxtRouteMiddleware, navigateTo } from "nuxt/app";

export default defineNuxtRouteMiddleware((to, from) => {
  const { loggedIn } = useUserSession();

  // If user is not logged in and not on login page already redirect to login page
  if (to.name != "login" && !loggedIn.value) {
    return navigateTo("/login");
  }

  // If user is logged in and tries to go to login page: DON'T
  if (to.name == "login" && loggedIn.value) {
    return abortNavigation();
  }
});
