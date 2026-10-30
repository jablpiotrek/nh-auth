import type { NuxtI18nOptions } from "@nuxtjs/i18n";

// @nuxtjs/i18n's module options - read by the Nuxt module during build
// setup, so this has to be passed into defineNuxtConfig's `i18n` key
// (nuxt.config.ts), not a runtime plugin: by the time any defineNuxtPlugin
// file runs, the module has already finished registering locales/routing.
export const i18nConfig: NuxtI18nOptions = {
  locales: [
    { code: "en", language: "en-US", name: "English", file: "en.json" },
    { code: "pl", language: "pl-PL", name: "Polski", file: "pl.json" },
    { code: "fr", language: "fr-FR", name: "Français", file: "fr.json" },
  ],
  defaultLocale: "en",
  // Our route guard (middleware/auth.global.ts) matches on exact `to.path`
  // against AppRoute - "prefix_except_default" would put non-default
  // locales behind a /pl or /fr prefix and break that matching.
  strategy: "no_prefix",
};
