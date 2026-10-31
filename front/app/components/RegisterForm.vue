<script setup lang="ts">
import { AppRoute } from "~/types/routes";
import { registerSchema } from "~/schemas/auth";

const { t } = useI18n();
const auth = useAuthStore();

const email = ref("");
const password = ref("");
const repeatPassword = ref("");
const subscribe = ref(false);
const isSubmitting = ref(false);

const { isValid, touch, touchAll, errorFor } = useFormValidation(registerSchema, () => ({
  email: email.value,
  password: password.value,
  repeatPassword: repeatPassword.value,
}));
const emailError = errorFor("email");
const passwordError = errorFor("password");
const repeatPasswordError = errorFor("repeatPassword");

async function onRegister() {
  if (!isValid.value) {
    touchAll(["email", "password", "repeatPassword"]);
    return;
  }
  isSubmitting.value = true;
  try {
    await auth.register({
      email: email.value.trim(),
      password: password.value,
      configuration: { subscribed: subscribe.value },
    });
    const { confetti } = await import("~/utils/confetti");
    confetti();
    await navigateTo(AppRoute.RegisterSuccess);
  } catch {
    // The api plugin already showed the global error banner.
  } finally {
    isSubmitting.value = false;
  }
}

function onGoToLogin() {
  navigateTo(AppRoute.Login);
}
</script>

<template>
  <form novalidate @submit.prevent="onRegister">
    <nord-stack>
      <nord-field :invalid="!!emailError">
        <nord-field-label for="register-email">{{ t("common.email") }}</nord-field-label>
        <nord-input
          id="register-email"
          v-model="email"
          type="email"
          name="email"
          autocomplete="email"
          expand
          required
          @focusout="touch('email')"
        />
        <nord-field-error v-if="emailError">{{ t(emailError) }}</nord-field-error>
      </nord-field>
      <nord-field :invalid="!!passwordError">
        <nord-field-label for="register-password">{{ t("common.password") }}</nord-field-label>
        <PasswordInput
          id="register-password"
          v-model="password"
          name="password"
          autocomplete="new-password"
          @focusout="touch('password')"
        />
        <nord-field-error v-if="passwordError">{{ t(passwordError) }}</nord-field-error>
      </nord-field>
      <nord-field :invalid="!!repeatPasswordError">
        <nord-field-label for="register-repeat-password">{{
          t("pages.register.repeatPassword")
        }}</nord-field-label>
        <PasswordInput
          id="register-repeat-password"
          v-model="repeatPassword"
          name="repeatPassword"
          autocomplete="new-password"
          @focusout="touch('repeatPassword')"
        />
        <nord-field-error v-if="repeatPasswordError">{{ t(repeatPasswordError) }}</nord-field-error>
      </nord-field>
      <nord-field orientation="horizontal">
        <nord-checkbox id="register-subscribe" v-model="subscribe" type="checkbox"></nord-checkbox>
        <nord-field-label for="register-subscribe">{{ t("common.subscribe") }}</nord-field-label>
      </nord-field>
      <nord-button
        type="submit"
        variant="primary"
        expand
        :loading="isSubmitting"
        :disabled="isSubmitting || !isValid"
      >
        <nord-icon slot="start" name="user-add"></nord-icon>
        {{ t("pages.register.registerButton") }}
      </nord-button>
      <nord-button
        type="button"
        variant="plain"
        expand
        :disabled="isSubmitting"
        @click="onGoToLogin"
      >
        <nord-icon slot="start" name="arrow-left-long"></nord-icon>
        {{ t("pages.register.backToLogin") }}
      </nord-button>
    </nord-stack>
  </form>
</template>
