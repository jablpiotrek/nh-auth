// Endpoints that either aren't authenticated (login/register: a 401 there
// means wrong credentials, not an expired token) or are the refresh call
// itself (retrying it on its own 401 would recurse forever).
const NO_REFRESH_RETRY_PATHS = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"];

type RetryableOptions = {
  __retriedAfterRefresh?: boolean;
  retry?: number;
  retryStatusCodes?: number[];
};

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
    // One global error banner for every API failure - callers never need
    // their own try/catch just to display something went wrong. A 401
    // from an authenticated endpoint gets one silent refresh-and-retry
    // first, since the access token is short-lived by design.
    async onResponseError({ request, response, options }) {
      const opts = options as RetryableOptions;
      const isRefreshable =
        response.status === 401 &&
        !opts.__retriedAfterRefresh &&
        !NO_REFRESH_RETRY_PATHS.some((path) => String(request).includes(path));

      if (isRefreshable) {
        opts.__retriedAfterRefresh = true;
        const auth = useAuthStore();
        const refreshed = await auth
          .refreshSession()
          .then(() => true)
          .catch(() => false);
        if (refreshed) {
          // onRequest's own Authorization header write picks up the new
          // token when ofetch replays this request below.
          opts.retry = 1;
          opts.retryStatusCodes = [401];
          return;
        }
        // Refresh itself failed - the session is truly dead, not just the
        // access token. Clear local state so the UI reflects that.
        auth.$reset();
      }
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
