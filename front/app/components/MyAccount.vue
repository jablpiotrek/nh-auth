<script setup lang="ts">
defineProps<{
  email: string;
  isUpdatingSubscription: boolean;
}>();

const subscribed = defineModel<boolean>("subscribed", { required: true });

const { t } = useI18n();
</script>

<template>
  <i18n-t keypath="pages.account.welcome" tag="p" class="n:text-l">
    <template #email
      ><strong>{{ email }}</strong></template
    >
  </i18n-t>
  <nord-stack direction="horizontal" gap="s" align-items="center">
    <nord-field orientation="horizontal">
      <nord-toggle
        id="account-subscribe"
        v-model="subscribed"
        type="checkbox"
        :disabled="isUpdatingSubscription"
      ></nord-toggle>
      <nord-field-label for="account-subscribe">{{ t("common.subscribe") }}</nord-field-label>
    </nord-field>
    <nord-spinner
      v-if="isUpdatingSubscription"
      size="s"
      :label="t('common.loading')"
    ></nord-spinner>
  </nord-stack>
</template>
