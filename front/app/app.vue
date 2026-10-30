<script setup lang="ts">
const route = useRoute();

useHead({
  title: computed(() => `${route.meta.title as string} · nh-auth`),
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
