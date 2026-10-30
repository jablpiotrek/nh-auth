<script setup lang="ts">
import { AppRoute } from "~/types/routes";
import { getCurrentUser, updateConfiguration } from "~/services/userService";

definePageMeta({ title: "pages.account.title" });

const { t } = useI18n();
const auth = useAuthStore();
const isLoading = ref(true);
const isUpdatingSubscription = ref(false);

onMounted(async () => {
  if (!auth.accessToken) return;
  try {
    const user = await getCurrentUser();
    auth.email = user.email;
    auth.subscribed = user.subscribed;
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

const subscribed = computed({
  get: () => auth.subscribed ?? false,
  set: (checked: boolean) => {
    void onSubscribedChange(checked);
  },
});

async function onSubscribedChange(checked: boolean) {
  const previous = auth.subscribed;
  auth.subscribed = checked;
  isUpdatingSubscription.value = true;
  try {
    const user = await updateConfiguration({ subscribed: checked });
    auth.subscribed = user.subscribed;
  } catch {
    // Revert the optimistic flip - the global api plugin already showed
    // the error banner.
    auth.subscribed = previous;
  } finally {
    isUpdatingSubscription.value = false;
  }
}
</script>

<template>
  <nord-stack class="n:max-inline-[340px] n:pt-xl n:pl-xl">
    <nord-spinner v-if="isLoading" size="l" :label="t('common.loading')"></nord-spinner>
    <template v-else>
      <i18n-t keypath="pages.account.welcome" tag="p" class="n:text-l">
        <template #email
          ><strong>{{ auth.email }}</strong></template
        >
      </i18n-t>
      <nord-stack direction="horizontal" gap="s" align-items="center">
        <nord-field orientation="horizontal">
          <nord-checkbox
            id="account-subscribe"
            v-model="subscribed"
            type="checkbox"
            :disabled="isUpdatingSubscription"
          ></nord-checkbox>
          <nord-field-label for="account-subscribe">{{ t("common.subscribe") }}</nord-field-label>
        </nord-field>
        <nord-spinner
          v-if="isUpdatingSubscription"
          size="s"
          :label="t('common.loading')"
        ></nord-spinner>
      </nord-stack>
    </template>
  </nord-stack>
</template>
