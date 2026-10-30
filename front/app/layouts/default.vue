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

<style scoped>
/* nord-layout always sets its internal navState to "opened" on wide
   screens, even with zero nav content (its willUpdate() never checks
   whether the nav slot actually has anything in it). That flips the
   host's [nav-open] attribute true, which makes nord-layout's own
   sticky-footer CSS offset the footer by --_n-layout-nav-width (250px)
   as if a sidebar were open. We have no nav, so force it back to 0. */
nord-footer[slot="footer"] {
  inset-inline-start: 0 !important;
}
</style>
