<script setup lang="ts">
const props = defineProps<{
  id: string;
  name: string;
  autocomplete: "current-password" | "new-password";
}>();

const value = defineModel<string>({ required: true });
const { t } = useI18n();

const visible = ref(false);
const type = computed(() => (visible.value ? "text" : "password"));
const tooltipId = computed(() => `${props.id}-toggle-tooltip`);
const toggleLabel = computed(() =>
  t(visible.value ? "common.hidePassword" : "common.showPassword"),
);

function toggleVisible() {
  visible.value = !visible.value;
}
</script>

<template>
  <nord-input
    :id="id"
    v-model="value"
    :type="type"
    :name="name"
    :autocomplete="autocomplete"
    expand
    required
  >
    <nord-button
      slot="end"
      type="button"
      square
      :aria-label="toggleLabel"
      :aria-pressed="visible"
      :aria-describedby="tooltipId"
      @click="toggleVisible"
    >
      <nord-icon name="interface-edit-on"></nord-icon>
      <nord-icon name="interface-edit-off"></nord-icon>
    </nord-button>
    <nord-tooltip :id="tooltipId">{{ t("common.togglePasswordVisibility") }}</nord-tooltip>
  </nord-input>
</template>

<style scoped>
/* Nord's own documented pattern (input "Custom Button" example): show
   whichever icon matches the current reflected type attribute. */
nord-input[type="password"] nord-icon[name="interface-edit-off"],
nord-input[type="text"] nord-icon[name="interface-edit-on"] {
  display: none;
}
</style>
