import { AppRoute } from "~/types/routes";

const OPEN_ROUTES: string[] = [AppRoute.Login, AppRoute.Register];
const AUTH_ROUTES: string[] = [AppRoute.Home, AppRoute.RegisterSuccess];

// Module-level, not store state: must survive exactly as long as this one
// page load (reset on an actual reload, never retried on SPA navigation).
let hasTriedBootRefresh = false;

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore();

  if (!hasTriedBootRefresh) {
    hasTriedBootRefresh = true;
    if (!auth.isLoggedIn) {
      // The access token is memory-only and lost on every reload; the
      // httpOnly refresh cookie survives it, so try to silently
      // re-establish the session from it before deciding any redirect.
      await auth.refreshSession().catch(() => undefined);
    }
  }

  if (OPEN_ROUTES.includes(to.path) && auth.isLoggedIn) {
    return navigateTo(AppRoute.Home);
  }
  if (AUTH_ROUTES.includes(to.path) && !auth.isLoggedIn) {
    return navigateTo(AppRoute.Login);
  }
});
