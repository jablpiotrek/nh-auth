import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ["@nuxt/eslint"],
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  // Task requirement: client-side only rendering, no SSR.
  ssr: false,

  css: ["~/assets/css/main.css"],

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
