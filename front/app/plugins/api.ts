export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  const api = $fetch.create({
    baseURL: config.public.apiBaseUrl,
    credentials: "include",
    onRequest({ options }) {
      const auth = useAuthStore();
      if (auth.accessToken) {
        options.headers.set("Authorization", `Bearer ${auth.accessToken}`);
      }
      // Optimistic clear: a fresh request superseding an old error (e.g.
      // the user retrying) shouldn't leave a stale banner up if it works.
      useApiErrorStore().dismiss();
    },
    // One global error banner for every API failure - callers never
    // need their own try/catch just to display something went wrong.
    onResponseError({ response }) {
      useApiErrorStore().show(errorKeyFromDetail(response._data?.detail));
    },
    onRequestError() {
      useApiErrorStore().show("errors.generic");
    },
  });

  return {
    provide: { api },
  };
});

declare module "#app" {
  interface NuxtApp {
    $api: typeof $fetch;
  }
}
