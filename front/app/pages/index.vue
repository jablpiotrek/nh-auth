<script setup lang="ts">
definePageMeta({ title: "pages.account.title" });

const auth = useAuthStore();
</script>

<template>
  <nord-stack class="n:max-inline-[340px] n:pt-xl n:pl-xl">
    <i18n-t keypath="pages.account.welcome" tag="p" class="n:text-l">
      <template #email
        ><strong>{{ auth.email }}</strong></template
      >
    </i18n-t>
  </nord-stack>
</template>
