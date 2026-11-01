# back

FastAPI app, managed with `uv`, Python 3.13. See root
[`CLAUDE.md`](../CLAUDE.md) for monorepo/deployment context and
[`README.md`](README.md) for the architecture, DB schema, and the full
register/login/JWT flow end to end. This file covers *why* things were
built the way they were, not what they do.

## Status

Feature-complete for this project's scope: all six endpoints
(`register`/`login`/`refresh`/`logout`/`users/me` GET/PATCH), schema
applied via Alembic (`alembic/versions/`). Verified with `make test`
(pytest + httpx against the real FastAPI app, in-memory SQLite via a
`get_db` override) and by hand against local Postgres.

**Deployed**: live on Render's low-end always-on compute tier, backed by
Neon Postgres. Render's own Auto-Deploy is turned **off** —
deploys instead go through `.github/workflows/backend.yml`: on push to
`main` touching `back/**`, it runs `uv run pytest` (with placeholder
non-secret env vars, since tests override `get_db` with in-memory SQLite
and never touch `Settings()`'s real values) and only `curl`s Render's
deploy hook (repo secret `RENDER_DEPLOY_HOOK`) if that passes. See root
[`CLAUDE.md`](../CLAUDE.md)'s Deployment/CI-CD sections for the full
platform-choice reasoning.

## Lint & format

**Ruff** for both — one Rust-based tool replacing flake8/isort/Black,
already the de facto standard for new Python projects and, notably, made
by the same team (Astral) as `uv`. No serious case against it for this
project: it's faster and simpler (one config, one dependency) than
assembling flake8 + isort + Black, and its formatter is Black-compatible
so nothing is lost by not using Black directly. Config lives in
`pyproject.toml`'s `[tool.ruff]` / `[tool.ruff.lint]`; rule set is Ruff's
own E/F baseline plus `I` (import sorting), `UP` (modernize syntax), `B`
(bugbear - common bug patterns), `SIM` (simplification), `C4`
(comprehensions) - a standard, not-overly-noisy selection.

Commands: `uv run ruff check --fix .`, then `uv run ruff format .` (fix
before format - Ruff's own documented order, since fixes can change what
needs reformatting). Python/`uv` has no built-in equivalent of npm
`scripts`, so a `Makefile` provides the short aliases instead:
`make lint`, `make lint-fix`, `make format`, `make format-check`.

**Pre-commit hook**: extends the same root `.husky/pre-commit` used by
`front/` (one hook system for the whole repo, rather than also adopting
Python's separate `pre-commit` framework just for this side). On any
commit touching a `back/*.py` file, it runs `ruff check --fix` then
`ruff format` over the whole `back/` tree (simpler than per-file
plumbing, cheap at this project's size) and re-stages the result. If
`ruff check` still reports an error it can't safely auto-fix, the hook
exits non-zero and the commit is blocked, leaving the partial fix
unstaged for manual review - verified by hand for both the clean-autofix
and blocked-on-real-error cases.

## Database: local Postgres for dev, cloud only for the deployed app

**Local dev and anyone reviewing this repo use Postgres via Docker Compose**
(`back/docker-compose.yml`, `make db-up` / `make db-down`), *not* a cloud
database. This was a deliberate reversal of an earlier plan to use a cloud
Postgres (Neon) for local dev too — a reviewer cloning this repo has no way
to get a working `DATABASE_URL` for someone else's cloud database, and a
project that doesn't start without a secret the reviewer doesn't have fails
the actual goal of this project. `back/.env.example` reflects this:
`DATABASE_URL=postgresql+asyncpg://nh_auth:nh_auth@localhost:5432/nh_auth`
(trivial, non-secret credentials — this is a disposable local container,
not anything resembling production data).

**Cloud Postgres is Neon** (free tier, region `eu-central-1`), used only by
the actually-deployed backend on Render. `DATABASE_URL`/`DATABASE_SSL` are
set as environment variables in Render's own dashboard, never committed
here, never needed to run or review this repo locally. Two things that
needed handling beyond swapping the URL:
- **Connection type**: Neon offers a pooled (PgBouncer) and a direct
  connection string. We use the **direct** one — the app already manages
  its own async connection pool via SQLAlchemy, so stacking Neon's pooler
  on top would just add the PgBouncer prepared-statement-cache gotcha for
  no benefit.
- **SSL**: Neon's connection string uses `?sslmode=require&channel_binding=require`,
  but asyncpg doesn't read `sslmode`/`channel_binding` from the URL at all
  (those are libpq/psycopg params) — passing it through silently fails to
  enable TLS rather than erroring. Fix: strip the query string entirely and
  pass `connect_args={"ssl": "require"}` to `create_async_engine` instead,
  gated on a `database_ssl: bool = False` setting (`db/session.py`,
  `core/config.py`). Local Docker Postgres has no TLS listener, so this
  defaults off locally and is set `DATABASE_SSL=true` only in Render's env.

**Python version**: Render defaults new services to the latest Python
(3.14 at the time of deploying), but this project is built/locked against
**3.13**. Pinned explicitly via `back/.python-version` (Render reads this
directly) rather than relying on the platform default staying compatible.

## Library choices (and why, so they don't get silently "improved" back)

- **Hashing: `argon2-cffi`** directly. *Not* `passlib` — unmaintained
  since 2020, breaks with modern `bcrypt` versions. Argon2id is OWASP's
  current first recommendation anyway.
- **JWT: `PyJWT >= 2.13.0`**. *Not* `python-jose` — unmaintained since
  2021, has an unpatched critical CVE. Always decode with an explicit
  `algorithms=["HS256"]` allow-list — PyJWT itself has had
  algorithm-confusion bypass advisories when callers skip this.
- **Data layer: SQLAlchemy 2.0 async** (`AsyncSession` + `asyncpg`) with
  separate Pydantic v2 schemas for request/response bodies. *Not*
  SQLModel — more boilerplate (one class for the DB model, one for the API
  schema), but SQLAlchemy 2.0's async support is mature, where SQLModel is
  still pre-1.0 (0.0.39) with real bus-factor risk for what is, here, the
  core user table of an auth system.
- **Migrations: Alembic** (standard pairing with SQLAlchemy).
- **Tests: `pytest` + `httpx.AsyncClient`** against the FastAPI app.

## Auth design decisions

Full JWT/refresh-token flow, schema, endpoint list, and file layout are in
[`README.md`](README.md). Decisions worth flagging specifically:

- **Refresh token is opaque, not a JWT** — it's validated by DB lookup
  either way, so a self-describing token buys nothing, and opaque tokens
  are the standard choice for refresh tokens specifically.
- **Logout identifies the caller via their access token, not the refresh
  cookie** — a deviation from the design as originally agreed, discovered
  while implementing: the refresh cookie's `Path=/auth/refresh` scoping
  means browsers never attach it to a `/auth/logout` request at all, so
  logout couldn't have looked it up that way regardless.
- **Account deletion was dropped** from scope after being originally
  planned — no endpoint deletes a user row now; the `refresh_tokens` →
  `users` cascade is kept as schema hygiene anyway.
- **CORS**: `CORS_ORIGIN` must exactly match `front/`'s deployed origin —
  no wildcard is possible once `allow_credentials=True` is set, and a
  mismatch here fails silently (blocked in the browser) rather than with a
  clear server-side error.
- **Same-site deployment, by design**: `front/` and `back/` are deployed
  as sibling subdomains of one parent domain (e.g. `app.<domain>` /
  `app-api.<domain>`) — different origins (so CORS is still required), but
  the same *site* as the SameSite cookie spec defines it (same
  registrable domain, subdomains ignored). That's what lets the refresh
  cookie use **`SameSite=Lax`** instead of `SameSite=None`
  (`api/cookies.py`): a same-site `fetch`/XHR still carries `Lax` cookies
  (the restriction only blocks genuinely cross-site requests), so this is
  strictly tighter CSRF protection than `None`, not a relaxation — `None`
  would only be required if front/back ever moved to unrelated domains.
  `Secure` stays on regardless, since both ends are HTTPS in any non-local
  environment.
- **Known gap, deliberately deferred**: no brute-force/rate-limiting on
  `/auth/login` yet. This is a visible, intentional decision, not an
  oversight — revisit before this goes anywhere near real users.

## Input validation

Email/password rules live in `app/schemas/auth.py` (Pydantic field
constraints + `field_validator`s). They're mirrored by hand in
[`../docs/auth-validation.md`](../docs/auth-validation.md) for `front/` to
read, since the two apps share no code — **update that file in the same
change** whenever `app/schemas/auth.py`'s rules change.
