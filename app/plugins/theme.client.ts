export default defineNuxtPlugin(async () => {
  const { loggedIn } = useUserSession();
  const { theme, themeCookie } = useTheme();

  function apply(value: string) {
    document.documentElement.setAttribute("data-theme", value);
  }

  if (themeCookie.value) {
    theme.value = themeCookie.value;
  }
  apply(theme.value);

  if (loggedIn.value) {
    try {
      const me = await $fetch<{ theme?: string }>("/api/users/me");
      if (me?.theme && me.theme !== theme.value) {
        theme.value = me.theme;
        themeCookie.value = me.theme;
        apply(me.theme);
      }
    } catch {
      // ignore - fall back to cookie/default
    }
  }

  watch(theme, apply);
});
