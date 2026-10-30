export const useAuthStore = defineStore("auth", {
  state: () => ({
    email: null as string | null,
  }),
  getters: {
    isLoggedIn: (state) => state.email !== null,
  },
  actions: {
    async login(email: string, _password: string): Promise<void> {
      // TODO(real-endpoint): POST /auth/login { email, password }, credentials: "include"
      this.email = email;
    },
    async register(email: string, _password: string): Promise<void> {
      // TODO(real-endpoint): POST /auth/register { email, password }, credentials: "include"
      // Backend auto-logs-in on register, so mirror that here too.
      this.email = email;
    },
    async logout(): Promise<void> {
      // TODO(real-endpoint): POST /auth/logout, credentials: "include"
      this.email = null;
    },
  },
});
