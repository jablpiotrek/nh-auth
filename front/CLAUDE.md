# front

Nuxt 4 app, client-side rendered only, styled with the Nordhealth (Nord)
design system. See root [`CLAUDE.md`](../CLAUDE.md) for monorepo/deployment
context and [`README.md`](README.md) for the architecture, tech stack, and
the full register/login/session flow end to end. This file covers _why_
things were built the way they were, not what they do. Register/login form
validation must match [`../docs/auth-validation.md`](../docs/auth-validation.md)
— the backend's actual Pydantic rules, hand-mirrored there since
`front/`/`back/` share no code.

## Status

Register, login, session bootstrap/refresh, logout, and the account page
(with the subscription toggle) are built, wired to `back/`, and deployed —
see `README.md` for the full flow of each. `front.yml` CI (test-gated
deploys, mirroring `back/`'s `backend.yml`) doesn't exist yet — see root
`CLAUDE.md`'s CI/CD section.

## Testing

- **Unit: Vitest** + `@nuxt/test-utils`'s `mountSuspended` (not plain
  `@vue/test-utils` alone) — needed for components that rely on Nuxt
  auto-imports/composables, which only resolve inside Nuxt's test
  environment. `vitest.config.ts` sets `test.environment: "nuxt"`.
  Tests live in `tests/nuxt/` — not `tests/unit/`: `test/nuxt`/`tests/nuxt`
  is a convention hardcoded in `@nuxt/kit` itself, so Nuxt's generated
  `tsconfig.app.json` picks the folder up (and with it the `~` alias)
  automatically, with no custom `hooks["prepare:types"]` needed. Run:
  `npm run test:unit`. Currently a single smoke test (`pages/login.vue`
  renders) — not yet expanded to cover form validation/submission.
- **E2E: Playwright**, not Cypress — Nuxt ships first-party integration
  (`@nuxt/test-utils/playwright`) that auto-builds and starts/stops the
  actual Nuxt server per test file via a `goto`/`page` fixture, so there's
  no manual `build && preview &` step in CI; it's also lighter than
  Cypress's Electron-based runner. Tests live in `tests/e2e/`. Run:
  `npm run test:e2e` (needs browser binaries once via
  `npx playwright install --with-deps chromium` - the `--with-deps` system
  package install needs passwordless `sudo`, which CI runners have but a
  sandboxed local shell may not). No backend runs in this suite — tests
  stub `/auth/*` and `/users/me` with `page.route()` and drive the real UI
  (see `README.md`'s Tests section).

## Key decisions

- **`ssr: false`** in `nuxt.config.ts` — this project is client-side
  rendered only, by design. This also sidesteps Nord's one documented Nuxt gotcha
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
  package is only listed as a _devDependency_ of `@nordhealth/css` (used to
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
- **`antfu/skills`** (Anthony Fu - core Vue/Nuxt/Vite maintainer, also the
  author of `@nuxt/eslint` which we already depend on) installed the same
  way, but pruned down to `nitro`, `nuxt`, `pinia`, `vite`, `vitest`, `vue`.
  Removed from the full collection, and why:
  - `unocss` - we use Tailwind, not UnoCSS; keeping it risked the AI
    suggesting UnoCSS utility patterns instead.
  - `pnpm` - we use npm.
  - `vitepress` - we're not building a docs site.
  - `antfu-create-pr` / `antfu-issue-triage` - his own GitHub workflow
    automation, unrelated to framework knowledge.
  - `antfu` (the general one) - not just framework reference: it pushes
    `@antfu/eslint-config` as a _Prettier replacement_ and recommends
    disabling Nuxt auto-imports entirely. Both directly contradict the
    ESLint+Prettier setup and ordinary auto-import usage we already built
    and tested - removed to avoid the AI "helpfully" relitigating settled
    decisions.
  - **Caveat on the kept `nuxt` skill**: it's generated against **Nuxt
    5.x**, while we're on **Nuxt 4.6.3** - real differences exist (Nitro
    v3/h3 v2, server utilities no longer auto-imported by default in v5,
    case-sensitive typed routing, Vite 8/Rolldown). Cross-check anything
    version-sensitive against our actual installed Nuxt version before
    trusting it.

- **State management: Pinia**, installed as the official Nuxt module
  (`npx nuxi module add pinia`, which adds `@pinia/nuxt` to
  `nuxt.config.ts`'s `modules` array) rather than a hand-written plugin —
  the module handles registration itself. Also installed `pinia` directly
  and `@vue/devtools-api` (a required peer dependency as of Pinia v4).
  `defineStore`/`storeToRefs`/etc. are auto-imported, as are stores placed
  in `app/stores/` (`auth.ts`, `apiError.ts` — see `README.md`).

## Node version

Nuxt 4.6.3 itself requires `^22.22.3 || ^24.15.0 || >=26.0.0` (its own
`package.json` `engines`). Pinned to the **Node 24 LTS line** specifically
(Node 22 is now in Maintenance LTS) via `package.json`'s `engines` field
(`^24.15.0`) and `.nvmrc` (`24.21.0`, the exact version this was built and
tested against — `nvm use` picks it up automatically).

## Lint & format

- **ESLint** (`@nuxt/eslint`) = code quality/correctness only. **Prettier**
  = all formatting — including `prettier-plugin-tailwindcss`, which
  auto-sorts utility classes, important here since elements mix plain
  Tailwind utilities with Nord's `n:`-prefixed ones.
  `eslint-config-prettier` is applied last in `eslint.config.mjs` to turn
  off any ESLint stylistic rules that would otherwise fight Prettier.
- Scripts: `npm run lint` / `lint:fix`, `npm run format` / `format:check`.
- **Pre-commit hook** (husky, configured at the repo root since git hooks
  are repo-wide): on any commit touching `front/`, runs `npx lint-staged`
  from inside `front/` (via `lint-staged` config in `front/package.json`),
  which Prettier-formats and ESLint-fixes staged files and re-stages the
  result. A real lint error (not just a formatting issue) blocks the
  commit and safely reverts any partial changes — verified by hand before
  relying on it.
