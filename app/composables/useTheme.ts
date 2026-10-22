export const DAISY_THEMES = [
  "light",
  "dark",
  "cupcake",
  "bumblebee",
  "emerald",
  "corporate",
  "synthwave",
  "retro",
  "cyberpunk",
  "valentine",
  "halloween",
  "garden",
  "forest",
  "aqua",
  "lofi",
  "pastel",
  "fantasy",
  "wireframe",
  "black",
  "luxury",
  "dracula",
  "cmyk",
  "autumn",
  "business",
  "acid",
  "lemonade",
  "night",
  "coffee",
  "winter",
  "dim",
  "nord",
  "sunset",
  "caramellatte",
  "abyss",
  "silk",
] as const;

export type DaisyTheme = (typeof DAISY_THEMES)[number];

export function useTheme() {
  const themeCookie = useCookie<string>("app-theme", {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    default: () => "dark",
  });
  const theme = useState<string>("theme", () => themeCookie.value);
  const themeError = useState<string>("theme:error", () => "");

  async function setTheme(next: string) {
    const previous = theme.value;
    theme.value = next;
    themeCookie.value = next;
    themeError.value = "";
    try {
      await $fetch("/api/users/me", { method: "PATCH", body: { theme: next } });
    } catch (cause) {
      theme.value = previous;
      themeCookie.value = previous;
      themeError.value = getApiErrorMessage(cause, "Failed to save theme");
      throw cause;
    }
  }

  return { theme, themeError, setTheme, themeCookie };
}
