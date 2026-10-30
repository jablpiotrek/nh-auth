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

export function refresh() {
  const { $api } = useNuxtApp();
  // Silent: failing to refresh on a fresh page load just means "not
  // logged in", the default state for most visits - not worth the
  // global error banner that onResponseError/onRequestError would
  // otherwise show.
  return $api<AccessTokenResponse>("/auth/refresh", {
    method: "POST",
    onResponseError: () => {},
    onRequestError: () => {},
  });
}
