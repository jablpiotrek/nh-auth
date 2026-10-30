# front

Nuxt 4 app, client-side rendered only, styled with the Nordhealth (Nord)
design system — the UI for nh-auth's register/login/account flow.

See the root [`README.md`](../README.md) for monorepo layout and how to run
this alongside `back/`, and [`CLAUDE.md`](CLAUDE.md) for _why_ specific
libraries/approaches were picked over alternatives and other decision
history.

## Local setup

```sh
cp .env.example .env
npm install
npm run dev        # http://localhost:3000
```

`NUXT_PUBLIC_API_BASE_URL` in `.env` must point at a running `back/`
instance (defaults to `http://localhost:8000`).

## Tests

- **Unit — Vitest**: `npm run test:unit`. Uses `@nuxt/test-utils`'s
  `mountSuspended` so Nuxt auto-imports/components resolve. Currently a
  smoke test that `pages/login.vue` renders.
- **E2E — Playwright**: `npm run test:e2e` (needs
  `npx playwright install --with-deps chromium` once). No backend runs in
  this suite — `tests/e2e/home.spec.ts` stubs `/auth/login`, `/users/me`,
  `/auth/logout` with `page.route()` and drives the real login → account
  page → logout round trip through the actual UI, plus an
  unauthenticated-redirect check.

## Tech stack

| Concern                | Choice                                               | Why                                                                                                                                 |
| ---------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Framework              | **Nuxt 4**, `ssr: false`                             | Client-side only per project requirements; also sidesteps Nord's documented SSR hydration-mismatch gotcha.                          |
| UI components          | **Nordhealth (`@nordhealth/components`)**            | `<nord-*>` native web components; registered client-only in `plugins/nord.client.ts`.                                               |
| Styling                | **Tailwind CSS v4** + Nord's `n:`-prefixed utilities | Nord's CSS exposes its own tokens as Tailwind utilities under the `n:` namespace to avoid clashing with plain Tailwind.             |
| State                  | **Pinia** (`@pinia/nuxt`)                            | `stores/auth.ts` (session) and `stores/apiError.ts` (global error banner).                                                          |
| HTTP client            | **ofetch**, via Nuxt's `$fetch`                      | Wrapped once as `$api` in `plugins/api.ts` — auth header injection, cookie credentials, global error handling, automatic 401 retry. |
| Client-side validation | **Zod**                                              | `schemas/auth.ts`, hand-mirrors `back/`'s Pydantic rules.                                                                           |
| i18n                   | **`@nuxtjs/i18n`**                                   | English/Polish/French; `strategy: "no_prefix"` (see below).                                                                         |
| Unit tests             | **Vitest** + `@nuxt/test-utils`                      |                                                                                                                                     |
| E2E tests              | **Playwright**, via `@nuxt/test-utils/playwright`    | First-party Nuxt integration auto-builds/starts the server per test file.                                                           |

## Project layout

```
app/
  pages/            login.vue, register.vue, register-success.vue, index.vue (account page)
  components/       AuthFormWrapper, LoginForm, RegisterForm, LogoutButton, PasswordInput, LocaleSwitcher
  stores/           auth.ts (session state), apiError.ts (global error banner)
  services/         authService.ts, userService.ts — one function per backend endpoint
  schemas/          auth.ts — Zod validation, mirrors back/app/schemas/auth.py
  middleware/       auth.global.ts — route guard + boot-time session refresh
  plugins/          api.ts ($api client), nord.client.ts (Nord component registration)
  composables/      useFormValidation.ts — Zod schema → reactive form-error helpers
  utils/            apiErrors.ts, zodErrors.ts — map raw errors to i18n keys / field errors
  types/            auth.ts (API request/response shapes), routes.ts (AppRoute enum)
  layouts/          default.vue — header, logout button, error banner, locale switcher
i18n/locales/       en.json, pl.json, fr.json
```

## Token handling model

- **Access token** lives **only in memory** — `stores/auth.ts`'s
  `accessToken` state. Never written to `localStorage`/`sessionStorage`,
  to limit the blast radius of an XSS bug. It's lost on every full page
  reload by design.
- **Refresh token** never touches frontend code at all. `back/` sets it as
  an `httpOnly`, `Secure`, `SameSite=None` cookie scoped to `/auth/refresh`
  — the browser attaches it automatically on refresh calls, and JavaScript
  can't read or store it even if it wanted to.
- Every backend call goes through `plugins/api.ts`'s `$api`, an `ofetch`
  instance created with `credentials: 'include'` (required for the
  cross-origin refresh cookie to be sent/accepted at all) and an
  `onRequest` hook that attaches `Authorization: Bearer <accessToken>`
  whenever the store has one.

## End-to-end flows

### Register

1. `RegisterForm.vue` validates email/password/repeat-password live
   against `schemas/auth.ts`'s `registerSchema` (Zod) via
   `composables/useFormValidation.ts`, which only shows a field's error
   once it's been blurred (`touch`/`touchAll`).
2. On submit, calls `stores/auth.ts`'s `register()` action with
   `{email, password, configuration: {subscribed}}`.
3. The store calls `services/authService.ts`'s `register()` →
   `$api('/auth/register', {method: 'POST', body})` → **`POST
back/auth/register`**.
4. Backend creates the user and auto-issues a session (see `back/README.md`
   §register); response is `{access_token}` plus the refresh cookie.
5. The store sets `accessToken`, `email`, `subscribed` in memory —
   optimistically, since it already knows exactly what was submitted.
6. Navigates to `/register-success`, which links on to `/` (the account
   page).

### Login

1. `LoginForm.vue` validates against `loginSchema` (Zod) — non-empty,
   length-bounded only, no complexity re-check, matching `back/`'s
   `LoginRequest`.
2. Calls `stores/auth.ts`'s `login()` → `services/authService.ts`'s
   `login()` → **`POST back/auth/login`**.
3. On success, the store sets `accessToken` and `email` in memory.
   `subscribed` stays `null` here — login's response doesn't include it,
   so the account page's own `GET /users/me` fills it in on mount.
4. Navigates to `/` (the account page).

### Session bootstrap / silent refresh (page reload)

The access token is memory-only, so a hard reload loses it even though the
user is still logged in server-side (the refresh cookie survives a reload).

1. `middleware/auth.global.ts` runs on every route change. On the very
   first navigation after a fresh page load — tracked by a module-level
   `hasTriedBootRefresh` flag, which (unlike store state) resets on an
   actual reload but not on SPA navigation — it calls
   `auth.refreshSession()` _before_ deciding whether to redirect.
2. `refreshSession()` (`stores/auth.ts`) calls
   `services/authService.ts`'s `refresh()` → **`POST back/auth/refresh`**
   (the cookie is sent automatically; failures are silenced via
   `onResponseError`/`onRequestError` no-ops, since "not logged in" is the
   default, expected outcome for most visits, not something worth a global
   error banner).
3. A module-level `refreshPromise` (again, not store state) de-dupes
   concurrent refresh attempts: the backend **rotates** the refresh token
   on every use, so two parallel calls would race and the second would
   always fail against an already-consumed token.
4. The route guard itself: routes in `OPEN_ROUTES` (`/login`, `/register`)
   redirect to `/` if already logged in; routes in `AUTH_ROUTES` (`/`,
   `/register-success`) redirect to `/login` if not.

### Authenticated request + automatic 401 retry

All of this lives in `plugins/api.ts`:

- `onRequest` — attaches `Authorization: Bearer <token>` if the store has
  one; also optimistically dismisses any shown error banner, so a retried
  action doesn't leave a stale banner up if it now succeeds.
- `onResponseError` — if a `401` comes back from any endpoint _other than_
  login/register/refresh/logout (`NO_REFRESH_RETRY_PATHS` — retrying those
  on their own 401 would either be meaningless or recurse), and this
  specific request hasn't already been retried once
  (`__retriedAfterRefresh`), it calls `auth.refreshSession()` and, if that
  succeeds, replays the original request (`options.retry = 1`) with the
  now-fresh token picked up by `onRequest`. If refresh itself fails, the
  session is genuinely dead: `auth.$reset()` clears local state and the
  global `apiError` store shows a mapped error message.
- This is how a 15-minute access token stays invisible to the rest of the
  app — any authenticated call self-heals once via the refresh token
  before the caller ever sees a 401.

### Account page (`/`, `pages/index.vue`)

1. On mount, if `auth.accessToken` is set, calls
   `services/userService.ts`'s `getCurrentUser()` → **`GET
back/users/me`** to authoritatively load `email`/`subscribed` — needed
   because neither login's nor refresh's response includes `subscribed`.
2. The subscription checkbox is optimistic: flips `auth.subscribed`
   immediately, calls `updateConfiguration()` → **`PATCH
back/users/me`**, and reverts the local value if the request fails (the
   global error banner from `plugins/api.ts` already reports the failure).
3. If the mount-time fetch itself throws (a token that slipped past the
   middleware but turned out to be invalid/expired), the page resets auth
   state and redirects to `/login`.

### Logout

- `LogoutButton.vue` lives in `layouts/default.vue`'s header, not inside
  any one page, so it stays mounted across the whole logout → login
  transition.
- Calls `stores/auth.ts`'s `logout()`, which best-effort calls
  `services/authService.ts`'s `logout()` → **`POST back/auth/logout`**
  (deletes the refresh-token row(s) and clears the cookie server-side) —
  but clears the local `accessToken`/`email` regardless of whether that
  call succeeds. A client stuck showing "logged in" is treated as worse
  than a server-side refresh token that just expires on its own.

## Error handling

- `stores/apiError.ts` is a one-field global Pinia store (`errorKey`),
  rendered by `layouts/default.vue` as a dismissible `<nord-banner>`.
- `utils/apiErrors.ts`'s `errorKeyFromDetail()` maps a backend error
  response's `detail` to a recognized `errors.*` i18n key, falling back to
  a generic `errors.generic` message for anything unrecognized (a 500, a
  network failure, or the 422 validation shape) — see
  [`../docs/auth-validation.md`](../docs/auth-validation.md) for the full
  contract of what `detail` values `back/` can send and when.

## Validation

- `schemas/auth.ts` (Zod) hand-mirrors `back/app/schemas/auth.py`
  (Pydantic) — the two apps share no code, so this file and
  [`../docs/auth-validation.md`](../docs/auth-validation.md) must both be
  updated by hand whenever the backend's validation rules change.
- `composables/useFormValidation.ts` wraps a Zod schema into reactive
  `isValid` / `touch(field)` / `touchAll(fields)` / `errorFor(field)`
  helpers — errors only render once a field has been touched (blurred),
  not on every keystroke.

## i18n

`@nuxtjs/i18n`, `strategy: "no_prefix"` — deliberate, since
`middleware/auth.global.ts`'s route guard matches the exact `to.path`
against `AppRoute`, and a locale-prefixed path (e.g. `/pl/login`) would
break that match. Locales: `en` (default), `pl`, `fr`
(`i18n/locales/*.json`). All user-facing error and validation messages are
i18n keys resolved with `t(key)` at render time, never raw strings.
