<script setup lang="ts">
const route = useRoute();
const { t } = useI18n();
const apiError = useApiErrorStore();
</script>

<template>
  <div class="page">
    <nord-header>
      <nord-stack direction="horizontal" gap="s" align-items="center">
        <nord-icon name="interface-shield" size="l"></nord-icon>
        <h1 class="n:text-l n:m-0">{{ t(route.meta.title as string) }}</h1>
      </nord-stack>
      <LogoutButton />
    </nord-header>
    <main class="page-main">
      <slot />
    </main>
    <nord-footer size="s">
      <LocaleSwitcher />
    </nord-footer>
    <nord-banner v-if="apiError.errorKey" class="page-banner" variant="danger">
      {{ t(apiError.errorKey) }}
      <nord-button
        slot="actions"
        size="s"
        square
        type="button"
        :aria-label="t('common.dismiss')"
        @click="apiError.dismiss()"
      >
        <nord-icon name="interface-close-small"></nord-icon>
      </nord-button>
    </nord-banner>
  </div>
</template>

<style scoped>
/* Hand-rolled sticky footer instead of nord-layout[sticky-footer]: that
   attribute makes the footer position:fixed unconditionally, so on tall
   pages it stays glued to the viewport bottom and overlaps the content
   that should scroll past it. This flex column lets the footer sit flush
   against the viewport edge when content is short (page-main grows to
   fill the gap) and flow naturally below content - off-screen until
   scrolled to - when content is tall. */
.page {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
}

.page-main {
  flex: 1 0 auto;
  padding: var(--n-space-l);
}

/* The notification banner must stay put on screen regardless of scroll
   position or the footer's current flow position (which, unlike before,
   is no longer pinned to the viewport bottom on tall pages) - so it's
   fixed to the viewport itself, independent of the footer. */
.page-banner {
  position: fixed;
  inset-inline: 0;
  bottom: var(--n-space-s);
  z-index: var(--n-index-sticky);
}
</style>
