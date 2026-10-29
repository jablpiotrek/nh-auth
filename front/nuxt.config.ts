import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ["@nuxt/eslint", "@pinia/nuxt"],
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  // Task requirement: client-side only rendering, no SSR.
  ssr: false,

  css: ["~/assets/css/main.css"],

  runtimeConfig: {
    public: {
      // NUXT_PUBLIC_API_BASE_URL - back/'s base URL. Different per
      // environment (local Uvicorn vs the deployed Render URL), so no
      // default here beyond local dev's.
      apiBaseUrl: "http://localhost:8000",
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  vue: {
    compilerOptions: {
      // Nord's <nord-*> elements are native custom elements, not Vue
      // components — tell Vue's compiler not to try to resolve them.
      isCustomElement: (tag) => tag.startsWith("nord-"),
    },
  },

  typescript: {
    tsConfig: {
      compilerOptions: {
        // Template IntelliSense for Nord components (the separate
        // @nordhealth/vue package is deprecated in favor of this file).
        types: ["@nordhealth/components/lib/vue.d.ts"],
      },
    },
  },

  hooks: {
    // Nuxt's generated tsconfig only includes the `test/nuxt` and
    // `tests/nuxt` conventions (hardcoded in @nuxt/kit) - our unit tests
    // live in `tests/unit/` per this app's own convention, so without
    // this they'd fall outside any TS project and lose the `~` alias
    // (e.g. `~/app.vue`), even though Vitest resolves it fine at runtime.
    "prepare:types": ({ tsConfig }) => {
      tsConfig.include ||= [];
      tsConfig.include.push("./tests/unit/**/*");
    },
  },
});
