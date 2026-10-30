import { AppRoute } from "~/types/routes";

const OPEN_ROUTES: string[] = [AppRoute.Login, AppRoute.Register];
const AUTH_ROUTES: string[] = [AppRoute.Home, AppRoute.RegisterSuccess];

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore();

  if (OPEN_ROUTES.includes(to.path) && auth.isLoggedIn) {
    return navigateTo(AppRoute.Home);
  }
  if (AUTH_ROUTES.includes(to.path) && !auth.isLoggedIn) {
    return navigateTo(AppRoute.Login);
  }
});
