<script setup lang="ts">
import { AppRoute } from "~/types/routes";

const { t } = useI18n();
const auth = useAuthStore();
const isLoggingOut = ref(false);

async function onLogout() {
  isLoggingOut.value = true;
  try {
    await auth.logout();
    await navigateTo(AppRoute.Login);
  } finally {
    // This component lives in the layout header, not the page, so it
    // stays mounted across the logout/login cycle - v-if just hides the
    // button below, it doesn't reset this ref. Without this, the next
    // login would reappear stuck in the stale loading state.
    isLoggingOut.value = false;
  }
}
</script>

<template>
  <nord-button
    v-if="auth.isLoggedIn"
    slot="end"
    :loading="isLoggingOut"
    :disabled="isLoggingOut"
    @click="onLogout"
  >
    <nord-icon slot="start" name="interface-logout"></nord-icon>
    {{ t("layout.logout") }}
  </nord-button>
</template>
