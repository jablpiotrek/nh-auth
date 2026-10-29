// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";
import eslintConfigPrettier from "eslint-config-prettier";

export default withNuxt(
  // Prettier owns formatting; this turns off ESLint rules that would
  // otherwise fight it. Must come last so it can override Nuxt's rules.
  eslintConfigPrettier,
);
