<script setup lang="ts">
import { AppRoute } from "~/types/routes";

definePageMeta({ title: "pages.register.title" });

const { t } = useI18n();
const auth = useAuthStore();

const email = ref("");
const password = ref("");
const repeatPassword = ref("");

async function onRegister() {
  // TODO(real-endpoint): validate email/password rules + password === repeatPassword, surface backend errors (409 duplicate email, 422 validation) once wired.
  await auth.register(email.value, password.value);
  await navigateTo(AppRoute.RegisterSuccess);
}

function onGoToLogin() {
  navigateTo(AppRoute.Login);
}
</script>

<template>
  <div class="n:flex n:justify-center">
    <nord-stack class="n:max-inline-[340px] n:w-full">
      <nord-card padding="l">
        <form novalidate @submit.prevent="onRegister">
          <nord-stack>
            <nord-field>
              <nord-field-label for="register-email">{{ t("common.email") }}</nord-field-label>
              <nord-input
                id="register-email"
                v-model="email"
                type="email"
                name="email"
                autocomplete="email"
                expand
                required
              />
            </nord-field>
            <nord-field>
              <nord-field-label for="register-password">{{
                t("common.password")
              }}</nord-field-label>
              <nord-input
                id="register-password"
                v-model="password"
                type="password"
                name="password"
                autocomplete="new-password"
                expand
                required
              />
            </nord-field>
            <nord-field>
              <nord-field-label for="register-repeat-password">{{
                t("pages.register.repeatPassword")
              }}</nord-field-label>
              <nord-input
                id="register-repeat-password"
                v-model="repeatPassword"
                type="password"
                name="repeatPassword"
                autocomplete="new-password"
                expand
                required
              />
            </nord-field>
            <nord-button type="submit" variant="primary" expand>
              <nord-icon slot="start" name="user-add"></nord-icon>
              {{ t("pages.register.registerButton") }}
            </nord-button>
            <nord-button type="button" variant="plain" expand @click="onGoToLogin">
              <nord-icon slot="start" name="arrow-left-long"></nord-icon>
              {{ t("pages.register.backToLogin") }}
            </nord-button>
          </nord-stack>
        </form>
      </nord-card>
    </nord-stack>
  </div>
</template>
