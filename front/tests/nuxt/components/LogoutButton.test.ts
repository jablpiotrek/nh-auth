import { describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import LogoutButton from "~/components/LogoutButton.vue";
import * as authService from "~/services/authService";

vi.mock("~/services/authService");
mockNuxtImport("navigateTo", () => vi.fn());

describe("LogoutButton", () => {
  it("renders nothing when no one is logged in", async () => {
    const wrapper = await mountSuspended(LogoutButton);

    expect(wrapper.find("nord-button").exists()).toBe(false);
  });

  it("logs out and returns to the login page when clicked", async () => {
    vi.mocked(authService.logout).mockResolvedValue(undefined);
    const auth = useAuthStore();
    auth.accessToken = "token-123";
    auth.email = "alice@example.com";

    const wrapper = await mountSuspended(LogoutButton);
    await wrapper.find("nord-button").trigger("click");
    await flushPromises();

    expect(authService.logout).toHaveBeenCalledOnce();
    expect(navigateTo).toHaveBeenCalledWith("/login");
  });
});
