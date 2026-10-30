import tailwindcss from "@tailwindcss/vite";
import { i18nConfig } from "./i18n/config";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ["@nuxt/eslint", "@pinia/nuxt", "@nuxtjs/i18n"],
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  i18n: i18nConfig,

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
});
