# nh-auth

A learning/recruitment-kata project: a register/login flow plus a "logged
in" account page. Monorepo with two fully independent apps — see their own
`CLAUDE.md` for specifics:

- [`front/CLAUDE.md`](front/CLAUDE.md) — Nuxt frontend
- [`back/CLAUDE.md`](back/CLAUDE.md) — FastAPI backend

## Monorepo shape

`front/` (npm/Node) and `back/` (uv/Python) share zero code and use
different language ecosystems entirely, so there's **no dedicated monorepo
tool** (no Turborepo, Nx, or JS workspaces) — there's nothing for one to
coordinate. Each app has its own independent toolchain and lockfile; run
them separately.

## Deployment

- **`front/`** → **Vercel**, as its own Vercel project with Root Directory
  set to `front/`. This is Vercel's native strength (Nuxt/Nitro).
- **`back/`** → **Railway or Render** (exact pick TBD), *not* Vercel's
  Python serverless runtime. Reason: FastAPI's normal idiom is one async
  Postgres connection pool created at startup and reused for the app's
  life; that's been reported as unreliable on Vercel's serverless Python
  functions across cold starts. Railway/Render run FastAPI as a normal
  long-lived process, so the backend stays idiomatic — no platform-specific
  workarounds in code that's meant to read as a textbook implementation.

Because the two apps deploy to different domains, cross-origin requests
(cookies, CORS) matter — see `back/CLAUDE.md` for the auth cookie contract.

## Status

Both apps are currently empty working scaffolds (they start and do
nothing) — no pages/components in `front/`, no endpoints/DB in `back/`.
Feature work (the actual register/login/account pages and endpoints)
comes next, one module at a time.
