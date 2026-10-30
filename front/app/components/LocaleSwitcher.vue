<script setup lang="ts">
const { t, locale, locales, setLocale } = useI18n();

function onLocaleChange(event: Event) {
  const value = (event.target as HTMLElement & { value?: string }).value;
  if (value) setLocale(value);
}
</script>

<template>
  <div>
    <nord-visually-hidden id="locale-switcher-label">{{
      t("footer.language")
    }}</nord-visually-hidden>
    <nord-segmented-control aria-labelledby="locale-switcher-label" @change="onLocaleChange">
      <nord-segmented-control-item
        v-for="loc in locales"
        :key="loc.code"
        size="s"
        :label="loc.name ?? loc.code"
        name="locale"
        :value="loc.code"
        :checked="locale === loc.code"
      ></nord-segmented-control-item>
    </nord-segmented-control>
  </div>
</template>
