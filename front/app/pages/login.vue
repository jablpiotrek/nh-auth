<script setup lang="ts">
import { AppRoute } from "~/types/routes";

definePageMeta({ title: "pages.login.title" });

const { t } = useI18n();
const auth = useAuthStore();

const email = ref("");
const password = ref("");

async function onLogin() {
  // TODO(real-endpoint): surface backend errors (401 wrong credentials, 422 validation) once wired.
  await auth.login(email.value, password.value);
  await navigateTo(AppRoute.Home);
}

function onGoToRegister() {
  navigateTo(AppRoute.Register);
}
</script>

<template>
  <div class="n:flex n:justify-center">
    <nord-stack class="n:max-inline-[340px] n:w-full">
      <nord-card padding="l">
        <form novalidate @submit.prevent="onLogin">
          <nord-stack>
            <nord-field>
              <nord-field-label for="login-email">{{ t("common.email") }}</nord-field-label>
              <nord-input
                id="login-email"
                v-model="email"
                type="email"
                name="email"
                autocomplete="email"
                expand
                required
              />
            </nord-field>
            <nord-field>
              <nord-field-label for="login-password">{{ t("common.password") }}</nord-field-label>
              <nord-input
                id="login-password"
                v-model="password"
                type="password"
                name="password"
                autocomplete="current-password"
                expand
                required
              />
            </nord-field>
            <nord-button type="submit" variant="primary" expand>
              <nord-icon slot="start" name="interface-login"></nord-icon>
              {{ t("pages.login.loginButton") }}
            </nord-button>
            <nord-button type="button" expand @click="onGoToRegister">
              <nord-icon slot="start" name="user-add"></nord-icon>
              {{ t("pages.login.registerButton") }}
            </nord-button>
          </nord-stack>
        </form>
      </nord-card>
    </nord-stack>
  </div>
</template>
