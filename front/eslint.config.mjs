// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";
import eslintConfigPrettier from "eslint-config-prettier";

export default withNuxt(
  {
    rules: {
      // Nord's <nord-*> tags are native Web Components: their named slots
      // (e.g. slot="start"/"end" on an icon inside nord-button/nord-input)
      // only exist via the native `slot` attribute - there's no Vue
      // #slot-name equivalent for custom elements. This rule only knows
      // about Vue 2's deprecated slot syntax, so it misflags that as an
      // error every time we slot content into a Nord component.
      "vue/no-deprecated-slot-attribute": "off",
    },
  },
  // Prettier owns formatting; this turns off ESLint rules that would
  // otherwise fight it. Must come last so it can override Nuxt's rules.
  eslintConfigPrettier,
);
