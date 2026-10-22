// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt({
  rules: {
    // Prettier owns formatting and self-closes void/empty elements its own way.
    "vue/html-self-closing": "off",
  },
});
