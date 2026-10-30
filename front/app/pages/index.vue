<script setup lang="ts">
import { AppRoute } from "~/types/routes";
import { getCurrentUser } from "~/services/userService";

definePageMeta({ title: "pages.account.title" });

const { t } = useI18n();
const auth = useAuthStore();
const isLoading = ref(true);

onMounted(async () => {
  if (!auth.accessToken) return;
  try {
    const user = await getCurrentUser();
    auth.email = user.email;
  } catch {
    // Token turned out to be invalid/expired - reset and bounce to
    // login, same as the middleware would for a logged-out visitor.
    auth.$reset();
    await navigateTo(AppRoute.Login);
    return;
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <nord-stack class="n:max-inline-[340px] n:pt-xl n:pl-xl">
    <nord-spinner v-if="isLoading" size="l" :label="t('common.loading')"></nord-spinner>
    <i18n-t v-else keypath="pages.account.welcome" tag="p" class="n:text-l">
      <template #email
        ><strong>{{ auth.email }}</strong></template
      >
    </i18n-t>
  </nord-stack>
</template>
