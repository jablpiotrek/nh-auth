import type { UserAuthRequest } from "~/types/auth";
import {
  login as loginRequest,
  logout as logoutRequest,
  refresh as refreshRequest,
  register as registerRequest,
} from "~/services/authService";

// Module-level, not store state: the refresh token rotates server-side on
// every use, so concurrent 401s must share one in-flight refresh instead
// of each firing their own (a second parallel call would just fail since
// the first already invalidated the cookie it was sent).
let refreshPromise: Promise<void> | null = null;

export const useAuthStore = defineStore("auth", {
  state: () => ({
    accessToken: null as string | null,
    email: null as string | null,
  }),
  getters: {
    isLoggedIn: (state) => state.accessToken !== null,
  },
  actions: {
    async login(body: UserAuthRequest): Promise<void> {
      const { access_token } = await loginRequest(body);
      this.accessToken = access_token;
      this.email = body.email;
    },
    async register(body: UserAuthRequest): Promise<void> {
      // Backend auto-logs-in on register, so mirror that here too.
      const { access_token } = await registerRequest(body);
      this.accessToken = access_token;
      this.email = body.email;
    },
    async refreshSession(): Promise<void> {
      // Re-establishes accessToken from the httpOnly refresh cookie (e.g.
      // after a hard page reload, or when an in-flight request's token
      // turned out to be expired). Email isn't known yet here - the
      // account page's own GET /users/me call already fills that in once
      // the user lands there.
      if (!refreshPromise) {
        refreshPromise = (async () => {
          const { access_token } = await refreshRequest();
          this.accessToken = access_token;
        })().finally(() => {
          refreshPromise = null;
        });
      }
      return refreshPromise;
    },
    async logout(): Promise<void> {
      // Best-effort: always clear local state even if the server call
      // fails (e.g. network blip) - a stuck "still logged in" client is
      // worse than a stale server-side refresh token that just expires.
      if (this.accessToken) {
        await logoutRequest().catch(() => undefined);
      }
      this.accessToken = null;
      this.email = null;
    },
  },
});
