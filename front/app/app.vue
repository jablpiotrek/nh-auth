<script setup lang="ts">
const route = useRoute();
const { t, locale } = useI18n();

useHead({
  htmlAttrs: { lang: locale },
  title: computed(() => `${t(route.meta.title as string)} · nh-auth`),
});
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
