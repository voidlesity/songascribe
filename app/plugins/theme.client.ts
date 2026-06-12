export default defineNuxtPlugin(async () => {
  const { loggedIn } = useUserSession();
  const theme = useState<string>("theme", () => "dark");

  function apply(value: string) {
    document.documentElement.setAttribute("data-theme", value);
  }

  apply(theme.value);

  if (loggedIn.value) {
    try {
      const me = await $fetch<{ theme?: string }>("/api/users/me");
      if (me?.theme) {
        theme.value = me.theme;
        apply(me.theme);
      }
    } catch {
      // ignore - fall back to default
    }
  }

  watch(theme, apply);
});
