import type { UserAuthRequest } from "~/types/auth";
import {
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from "~/services/authService";

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
