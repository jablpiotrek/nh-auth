<script setup lang="ts">
import { AppRoute } from "~/types/routes";

definePageMeta({ title: "pages.registerSuccess.title" });

const { t } = useI18n();
</script>

<template>
  <AuthFormWrapper>
    <nord-stack align-items="center">
      <nord-icon
        name="interface-checked-circle-filled"
        size="xxl"
        color="var(--n-color-status-success)"
      ></nord-icon>
      <p>{{ t("pages.registerSuccess.message") }}</p>
      <NuxtLink v-slot="{ href, navigate }" :to="AppRoute.Home" custom>
        <nord-button variant="primary" expand :href="href" @click="navigate">
          <nord-icon slot="start" name="interface-home"></nord-icon>
          {{ t("pages.registerSuccess.goToMyPage") }}
        </nord-button>
      </NuxtLink>
    </nord-stack>
  </AuthFormWrapper>
</template>
