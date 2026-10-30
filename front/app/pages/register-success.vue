<script setup lang="ts">
import { AppRoute } from "~/types/routes";

definePageMeta({ title: "Registration successful" });

function onGoToMyPage() {
  navigateTo(AppRoute.Home);
}
</script>

<template>
  <div class="n:flex n:min-h-screen n:items-center n:justify-center">
    <nord-stack class="n:max-inline-[340px] n:w-full">
      <nord-card padding="l">
        <nord-stack align-items="center">
          <nord-icon
            name="interface-checked-circle-filled"
            size="xxl"
            color="var(--n-color-status-success)"
          ></nord-icon>
          <p>Your account has been created.</p>
          <nord-button variant="primary" expand @click="onGoToMyPage">
            <nord-icon slot="start" name="interface-home"></nord-icon>
            Go to my page
          </nord-button>
        </nord-stack>
      </nord-card>
    </nord-stack>
  </div>
</template>
