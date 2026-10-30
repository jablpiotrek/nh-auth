<script setup lang="ts">
import { AppRoute } from "~/types/routes";

const route = useRoute();
const auth = useAuthStore();

async function onLogout() {
  await auth.logout();
  await navigateTo(AppRoute.Login);
}
</script>

<template>
  <div>
    <nord-header>
      <nord-stack direction="horizontal" gap="s" align-items="center">
        <nord-icon name="interface-shield" size="l"></nord-icon>
        <h1 class="n:text-l n:m-0">{{ route.meta.title }}</h1>
      </nord-stack>
      <nord-button v-if="auth.isLoggedIn" slot="end" @click="onLogout">
        <nord-icon slot="start" name="interface-logout"></nord-icon>
        Logout
      </nord-button>
    </nord-header>
    <slot />
  </div>
</template>
