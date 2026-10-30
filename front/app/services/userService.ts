import type { UserResponse } from "~/types/auth";

export function getCurrentUser() {
  const { $api } = useNuxtApp();
  return $api<UserResponse>("/users/me");
}
