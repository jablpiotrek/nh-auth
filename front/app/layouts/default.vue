<script setup lang="ts">
const route = useRoute();
const { t } = useI18n();
const apiError = useApiErrorStore();

const bannerRef = ref<HTMLElement | null>(null);

// Errors are set asynchronously (after a failed API call), so there's
// nothing on screen yet for a keyboard/AT user to have tabbed to - move
// focus to the banner itself rather than leaving it unannounced.
watch(
  () => apiError.errorKey,
  (errorKey) => {
    if (errorKey) nextTick(() => bannerRef.value?.focus());
  },
);
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
      <nord-banner
        v-if="apiError.errorKey"
        ref="bannerRef"
        class="page-banner"
        variant="danger"
        tabindex="-1"
      >
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
      <slot />
    </main>
    <nord-footer size="s">
      <LocaleSwitcher />
    </nord-footer>
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
  /* dvh tracks Safari's actual visible viewport as its toolbar
     collapses/expands; 100vh (the max-possible height) is kept first as a
     fallback for browsers without dvh support. */
  min-height: 100vh;
  min-height: 100dvh;
  flex-direction: column;
}

.page-main {
  flex: 1 0 auto;
  padding: var(--n-space-l);
}

/* Nord's own guidance is to place a banner at the top of the section it
   applies to, not fixed to the viewport - that also keeps it right above
   whatever triggered it (a form submit) instead of off in the corner. */
.page-banner {
  margin-block-end: var(--n-space-l);
}
</style>
