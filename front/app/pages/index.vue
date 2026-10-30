<script setup lang="ts">
definePageMeta({ title: "Your account" });

const auth = useAuthStore();
</script>

<template>
  <nord-stack class="n:max-inline-[340px] n:pt-xl n:pl-xl">
    <p class="n:text-l">
      Welcome <strong>{{ auth.email }}</strong>
    </p>
  </nord-stack>
</template>
