<script setup lang="ts">
const route = useRoute();
const { t } = useI18n();
</script>

<template>
  <nord-layout sticky-footer>
    <nord-header slot="header">
      <nord-stack direction="horizontal" gap="s" align-items="center">
        <nord-icon name="interface-shield" size="l"></nord-icon>
        <h1 class="n:text-l n:m-0">{{ t(route.meta.title as string) }}</h1>
      </nord-stack>
      <LogoutButton />
    </nord-header>
    <slot />
    <nord-footer slot="footer" size="s">
      <LocaleSwitcher />
    </nord-footer>
  </nord-layout>
</template>
