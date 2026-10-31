<script setup lang="ts">
import { AppRoute } from "~/types/routes";

definePageMeta({ title: "pages.registerSuccess.title" });

const { t } = useI18n();

function onGoToMyPage() {
  navigateTo(AppRoute.Home);
}
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
      <nord-button variant="primary" expand @click="onGoToMyPage">
        <nord-icon slot="start" name="interface-home"></nord-icon>
        {{ t("pages.registerSuccess.goToMyPage") }}
      </nord-button>
    </nord-stack>
  </AuthFormWrapper>
</template>
