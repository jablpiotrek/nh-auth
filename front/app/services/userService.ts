import type { UserConfiguration, UserResponse } from "~/types/auth";

export function getCurrentUser() {
  const { $api } = useNuxtApp();
  return $api<UserResponse>("/users/me");
}

export function updateConfiguration(body: UserConfiguration) {
  const { $api } = useNuxtApp();
  return $api<UserResponse>("/users/me", {
    method: "PATCH",
    body,
  });
}
