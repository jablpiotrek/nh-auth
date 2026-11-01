# nh-auth

A sample register/login flow plus a "logged in" account page. Monorepo
with two fully independent apps. For architecture, technology choices, and
the full register/login/JWT end-to-end flow, see each app's own `README.md`;
for the reasoning behind specific decisions, see its `CLAUDE.md`:

- [`front/README.md`](front/README.md) / [`front/CLAUDE.md`](front/CLAUDE.md) — Nuxt frontend
- [`back/README.md`](back/README.md) / [`back/CLAUDE.md`](back/CLAUDE.md) — FastAPI backend

Register/login input validation (email/password rules, error shapes) is
documented once, by hand, in [`docs/auth-validation.md`](docs/auth-validation.md)
— `front/` and `back/` share zero code (below), so there's no schema to
import; keep that file in sync with `back/app/schemas/auth.py` whenever
either changes.

## Monorepo shape

`front/` (npm/Node) and `back/` (uv/Python) share zero code and use
different language ecosystems entirely, so there's **no dedicated monorepo
tool** (no Turborepo, Nx, or JS workspaces) — there's nothing for one to
coordinate. Each app has its own independent toolchain and lockfile; run
them separately.

## Deployment

- **`front/`** → **Vercel**, as its own Vercel project with Root Directory
  set to `front/`. This is Vercel's native strength (Nuxt/Nitro).
- **`back/`** → **Render**, on a low-end always-on compute tier — *not*
  Vercel's Python serverless runtime, and not Render's free compute tier
  either. Reasoning, in order of how the decision actually went:
  - Not Vercel: FastAPI's normal idiom is one async Postgres connection
    pool created at startup and reused for the app's life; that's been
    reported as unreliable on Vercel's serverless Python functions across
    cold starts. A long-lived process keeps the backend idiomatic — no
    platform-specific workarounds in code meant to read as a textbook
    implementation.
  - Not Render's free tier: it spins down after 15 min idle, and the
    ~30–60s cold start on the next request is a bad first impression for
    anyone opening the link cold.
  - Not Railway (the original pick): sign-ups were disabled when we tried
    to create an account — may well be temporary, but Render was ready
    now.
  - Not FastAPI Cloud (the official FastAPI-team platform, public beta):
    its free Hobby tier is scale-to-zero only, the same cold-start problem
    as Vercel/Render-free; its always-on paid tier costs more than
    Render's equivalent for the same guarantee, on unproven beta infra.
  - Render's own pricing has two separate layers that are easy to
    conflate: an account-level **workspace plan** (team features) and a
    separately-billed **per-service compute instance type**. The low-end
    paid compute tier is available on the free workspace plan — confirmed
    directly against Render's own pricing page — so there was no need to
    upgrade the workspace plan just to get always-on compute.
- **Database**: Neon Postgres (free tier), region `eu-central-1`
  (Frankfurt) — see `back/CLAUDE.md` for the connection-string/SSL details
  (asyncpg needs different handling than Neon's default connection
  string). Render's free Postgres was considered and rejected: its free
  tier **expires 30 days after creation** (then a 14-day grace period,
  then deletion) — a bad trap for a project meant to stay reviewable
  indefinitely, and even Render's cheapest paid tier added cost without
  replacing Neon's free tier's reliability.

`front/` and `back/` are deployed as sibling subdomains of the same parent
domain (e.g. `app.<domain>` and `app-api.<domain>`) — different origins, so
CORS still applies, but the same *site* for cookie purposes (see
`back/CLAUDE.md` for what that does and doesn't relax about the auth
cookie contract).

## CI/CD

GitHub Actions (`.github/workflows/`), one workflow file per app (mirrors
the "two fully independent apps" shape — each workflow is path-filtered to
its own directory, same spirit as `.husky/pre-commit`'s per-path dispatch,
but native to Actions instead of hand-rolled).

- **`backend.yml`**: on push to `main` touching `back/**`, runs `back/`'s
  test suite (`uv run pytest`, with placeholder non-secret env vars so
  `Settings()` can load — tests override `get_db` with in-memory SQLite
  anyway, so the values just need to be well-formed, not reachable).
  Only if tests pass does a `deploy` job `curl` Render's deploy hook URL
  (stored as the repo secret `RENDER_DEPLOY_HOOK`). Render's own
  **Auto-Deploy is turned off** in its dashboard so a push doesn't
  double-trigger a deploy (once from Render watching the branch, once
  from this hook).
- **`front.yml`** (Vercel): not yet created — planned for whenever
  `front/` actually deploys. Vercel's own GitHub integration auto-deploys
  on push by default; whether that gets replaced with the same
  test-gated-via-Actions pattern as `back/` is still an open question.

## Root `package.json`

Exists only to host `husky` for git hooks (hooks are inherently
repo-wide — there's one `.git` — unlike build/task tooling, which stays
per-app). This is **not** a monorepo build tool and doesn't contradict the
"no Turborepo/Nx" decision above; it has no scripts for building or
running either app.

`.husky/pre-commit` checks staged paths and dispatches per app: `front/`
changes run `lint-staged` (ESLint + Prettier) from inside `front/`;
`back/*.py` changes run Ruff (`check --fix` then `format`) over `back/`.
One hook system for the whole repo, even though each app's actual
lint/format tooling is entirely separate (npm-based vs. Ruff/uv-based).

## Git workflow

Agents (Claude Code or otherwise) must **never push to the remote** —
`git fetch` is fine, but `git push` (including to a feature branch) is
reserved for the user. Commit locally as normal; leave pushing to the
person running the session.

## Status

Both apps are feature-complete for this project's scope (register, login,
refresh, logout, account read/update) and deployed (`back/` on Render,
`front/` on Vercel). `front.yml` CI (test-gated deploys, mirroring
`backend.yml`) is still open. See each app's own `README.md`/`CLAUDE.md`
for details.
