# front

Nuxt 4 app, client-side rendered only, styled with the Nordhealth (Nord)
design system. See root [`CLAUDE.md`](../CLAUDE.md) for monorepo/deployment
context.

## Status

Empty working scaffold: Nuxt + CSR + Nord + Tailwind are fully wired and
verified (build succeeds, served HTML is an empty CSR shell, bundled CSS
contains Nord/Tailwind tokens, bundled JS registers `nord-*` elements). No
app-specific pages or components exist yet beyond Nuxt's default
`NuxtWelcome` — those come next.

## Key decisions

- **`ssr: false`** in `nuxt.config.ts` — the task requires a client-side
  only rendered app. This also sidesteps Nord's one documented Nuxt gotcha
  (SSR hydration mismatches from components reflecting attributes to the
  light DOM) — there's no server-rendered markup to mismatch against.
- **Custom elements**: Nord's `<nord-*>` tags are native Web Components,
  not Vue components. Vue is told this via
  `vue.compilerOptions.isCustomElement` in `nuxt.config.ts` (the Nuxt
  equivalent of the plain-Vite `vue({ template: { compilerOptions } })`
  pattern in Nord's own docs — Nuxt owns the Vite Vue plugin, so it's
  configured through Nuxt, not a separate Vite config file).
- **Component registration**: `@nordhealth/components` is imported once in
  `app/plugins/nord.client.ts` (client-only — these are browser-only custom
  elements anyway, consistent with the CSR-only app).
- **`v-model` on checkbox-like components** (`nord-checkbox`, `nord-toggle`,
  `nord-tag`) needs `type="checkbox"` added so Vue binds `checked` instead
  of `value`. Easy to forget when building the actual forms.
- **TypeScript**: `@nordhealth/components/lib/vue.d.ts` is added via
  `typescript.tsConfig.compilerOptions.types` in `nuxt.config.ts` (not by
  hand-editing `tsconfig.json`, since Nuxt regenerates it). The separate
  `@nordhealth/vue` package is deprecated — don't reach for it.
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite`, entry point in
  `app/assets/css/main.css`:
  ```css
  @import "tailwindcss";
  @import "@nordhealth/css/tailwind";
  ```
  Nord's own utilities are namespaced `n:` (e.g. `n:bg-surface`,
  `n:text-default`) to avoid colliding with plain Tailwind utilities.
  Prefer Tailwind utilities / Nord component props first; for custom CSS,
  use Nord's `--n-*` custom properties (never `--_n-*`, which are private
  and can change without notice).
- **Undeclared dependency quirk**: `@nordhealth/css`'s Tailwind entry point
  (`@nordhealth/css/tailwind`) imports from `@nordhealth/tokens`, but that
  package is only listed as a *devDependency* of `@nordhealth/css` (used to
  build it), not a runtime dependency — so it doesn't get installed
  automatically and the build fails resolving it. Fix: install
  `@nordhealth/tokens` directly as our own dependency. If a future
  `@nordhealth/css` upgrade fixes this upstream, this extra install becomes
  redundant but harmless.
- **Nord agent skill** installed scoped to this folder (not the repo root,
  since it's only relevant to frontend work): `.claude/skills/nord` and
  `.claude/skills/nord-full` (symlinks into `.agents/skills/`), via
  `npx skills add https://nordhealth.design`. Gives any AI agent working in
  `front/` structured knowledge of Nord's components, tokens, and
  conventions without re-deriving them from the live docs each time.

## Auth contract (for when the real pages land)

- Access token lives **in memory** on the frontend (never `localStorage`,
  to limit XSS blast radius).
- Every fetch to `back/` needs `credentials: 'include'` — the refresh
  token travels as an `httpOnly` cross-origin cookie (see
  `back/CLAUDE.md`).
