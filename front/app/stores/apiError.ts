export const useApiErrorStore = defineStore("apiError", {
  state: () => ({
    errorKey: null as string | null,
  }),
  actions: {
    show(key: string) {
      this.errorKey = key;
    },
    dismiss() {
      this.errorKey = null;
    },
  },
});
