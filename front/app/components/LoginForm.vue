<script setup lang="ts">
import { AppRoute } from "~/types/routes";
import { loginSchema } from "~/schemas/auth";

const { t } = useI18n();
const auth = useAuthStore();

const email = ref("");
const password = ref("");
const isSubmitting = ref(false);

const { isValid, touch, touchAll, errorFor } = useFormValidation(loginSchema, () => ({
  email: email.value,
  password: password.value,
}));
const emailError = errorFor("email");
const passwordError = errorFor("password");

async function onLogin() {
  if (!isValid.value) {
    touchAll(["email", "password"]);
    return;
  }
  isSubmitting.value = true;
  try {
    await auth.login({ email: email.value.trim(), password: password.value });
    await navigateTo(AppRoute.Home);
  } catch {
    // The api plugin already showed the global error banner.
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <form novalidate @submit.prevent="onLogin">
    <nord-stack>
      <nord-field :invalid="!!emailError">
        <nord-field-label for="login-email">{{ t("common.email") }}</nord-field-label>
        <nord-input
          id="login-email"
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
        <nord-field-label for="login-password">{{ t("common.password") }}</nord-field-label>
        <PasswordInput
          id="login-password"
          v-model="password"
          name="password"
          autocomplete="current-password"
          @focusout="touch('password')"
        />
        <nord-field-error v-if="passwordError">{{ t(passwordError) }}</nord-field-error>
      </nord-field>
      <nord-button
        type="submit"
        variant="primary"
        expand
        :loading="isSubmitting"
        :disabled="isSubmitting || !isValid"
      >
        <nord-icon slot="start" name="interface-login"></nord-icon>
        {{ t("pages.login.loginButton") }}
      </nord-button>
      <NuxtLink v-slot="{ href, navigate }" :to="AppRoute.Register" custom>
        <nord-button expand :href="href" :disabled="isSubmitting" @click="navigate">
          <nord-icon slot="start" name="user-add"></nord-icon>
          {{ t("pages.login.registerButton") }}
        </nord-button>
      </NuxtLink>
    </nord-stack>
  </form>
</template>
