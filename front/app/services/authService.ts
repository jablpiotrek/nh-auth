import type { AccessTokenResponse, UserAuthRequest } from "~/types/auth";

export function login(body: UserAuthRequest) {
  const { $api } = useNuxtApp();
  return $api<AccessTokenResponse>("/auth/login", {
    method: "POST",
    body,
  });
}

export function register(body: UserAuthRequest) {
  const { $api } = useNuxtApp();
  return $api<AccessTokenResponse>("/auth/register", {
    method: "POST",
    body,
  });
}

export function logout() {
  const { $api } = useNuxtApp();
  return $api("/auth/logout", { method: "POST" });
}
