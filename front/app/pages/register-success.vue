<script setup lang="ts">
import { AppRoute } from "~/types/routes";

definePageMeta({ title: "pages.registerSuccess.title" });

const { t } = useI18n();

function onGoToMyPage() {
  navigateTo(AppRoute.Home);
}
</script>

<template>
  <div class="n:flex n:justify-center">
    <nord-stack class="n:max-inline-[340px] n:w-full">
      <nord-card padding="l">
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
      </nord-card>
    </nord-stack>
  </div>
</template>
