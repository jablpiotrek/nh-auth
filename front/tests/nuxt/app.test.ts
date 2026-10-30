import { describe, expect, it } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import LoginPage from "~/pages/login.vue";

describe("LoginPage", () => {
  it("renders", async () => {
    const wrapper = await mountSuspended(LoginPage);
    expect(wrapper.html()).not.toBe("");
  });
});
