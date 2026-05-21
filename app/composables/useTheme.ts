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
] as const;

export type DaisyTheme = (typeof DAISY_THEMES)[number];

export function useTheme() {
  const theme = useState<string>("theme", () => "dark");

  async function setTheme(next: string) {
    theme.value = next;
    try {
      await $fetch("/api/users/me", {
        method: "PATCH",
        body: { theme: next },
      });
    } catch {
      // ignore
    }
  }

  return { theme, setTheme };
}
