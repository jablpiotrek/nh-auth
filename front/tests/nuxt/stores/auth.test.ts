import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "~/stores/auth";
import * as authService from "~/services/authService";

vi.mock("~/services/authService");

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

describe("auth store", () => {
  it("logs in: stores the access token and the email that was used to sign in", async () => {
    vi.mocked(authService.login).mockResolvedValue({
      access_token: "token-123",
      token_type: "bearer",
    });
    const auth = useAuthStore();

    await auth.login({ email: "alice@example.com", password: "Correct-Horse-9" });

    expect(auth.isLoggedIn).toBe(true);
    expect(auth.accessToken).toBe("token-123");
    expect(auth.email).toBe("alice@example.com");
  });

  it("registers: also stores the subscription choice made at sign-up", async () => {
    vi.mocked(authService.register).mockResolvedValue({
      access_token: "token-123",
      token_type: "bearer",
    });
    const auth = useAuthStore();

    await auth.register({
      email: "alice@example.com",
      password: "Correct-Horse-9",
      configuration: { subscribed: true },
    });

    expect(auth.isLoggedIn).toBe(true);
    expect(auth.subscribed).toBe(true);
  });

  it("logs out: clears local session state once the server confirms", async () => {
    vi.mocked(authService.login).mockResolvedValue({
      access_token: "token-123",
      token_type: "bearer",
    });
    vi.mocked(authService.logout).mockResolvedValue(undefined);
    const auth = useAuthStore();
    await auth.login({ email: "alice@example.com", password: "Correct-Horse-9" });

    await auth.logout();

    expect(auth.isLoggedIn).toBe(false);
    expect(auth.email).toBeNull();
  });

  it("logs out locally even if the server call fails (e.g. a network blip)", async () => {
    vi.mocked(authService.login).mockResolvedValue({
      access_token: "token-123",
      token_type: "bearer",
    });
    vi.mocked(authService.logout).mockRejectedValue(new Error("network error"));
    const auth = useAuthStore();
    await auth.login({ email: "alice@example.com", password: "Correct-Horse-9" });

    await auth.logout();

    expect(auth.isLoggedIn).toBe(false);
  });
});
