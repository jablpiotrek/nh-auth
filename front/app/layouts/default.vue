<script setup lang="ts">
const route = useRoute();
const { t } = useI18n();
const apiError = useApiErrorStore();
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
    <nord-banner v-if="apiError.errorKey" variant="danger">
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

/* sticky-footer makes the footer position:fixed to the viewport bottom.
   The content area it sits in doesn't itself stretch to fill the
   viewport, so position:sticky on the banner had no scroll range to
   stick within - it just rendered in normal flow, right after the card.
   Fixing the banner to the viewport bottom instead, offset by the
   footer's own live-measured height (--n-layout-footer-block-size -
   nord-layout publishes this itself via ResizeObserver, so it tracks
   the footer's actual rendered size, not a guessed pixel value), pins
   it flush above the footer regardless of page content length. */
nord-banner {
  position: fixed;
  inset-inline: 0;
  bottom: calc(var(--n-layout-footer-block-size, 0px) + var(--n-space-s));
  z-index: var(--n-layout-sticky-footer-z-index, calc(var(--n-index-top-bar, 1000) + 1));
}
</style>
