<script setup lang="ts">
import { AppRoute } from "~/types/routes";

const { t } = useI18n();
const auth = useAuthStore();
const isLoggingOut = ref(false);

async function onLogout() {
  isLoggingOut.value = true;
  await auth.logout();
  await navigateTo(AppRoute.Login);
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
