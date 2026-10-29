# back

FastAPI app, managed with `uv`, Python 3.13. See root
[`CLAUDE.md`](../CLAUDE.md) for monorepo/deployment context.

## Status

Implemented: all six endpoints (`register`/`login`/`refresh`/`logout`/
`users/me` GET+DELETE), per the design below. Schema applied via the
initial Alembic migration (`alembic/versions/..._create_users_and_refresh_tokens_tables.py`).
Verified with `make test` (pytest + httpx against the real FastAPI app,
in-memory SQLite via a `get_db` override — no Postgres needed to run the
suite) and by hand against local Postgres (`make db-up && make migrate &&
make dev`).

One deviation from the design as originally agreed, discovered while
implementing: **`/auth/logout` identifies the caller's refresh tokens via
the access token, not by reading the refresh cookie.** The refresh
cookie's `Path=/auth/refresh` scoping (deliberate, see below) means
browsers never attach it to a `/auth/logout` request in the first place —
so logout couldn't have looked it up that way regardless. Requiring a
valid access token (same requirement as account deletion) and deleting
that user's refresh-token row(s) by `user_id` is what "delete the
caller's refresh-token row" in the design below actually resolves to.

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
the actual goal of this kata. `back/.env.example` reflects this:
`DATABASE_URL=postgresql+asyncpg://nh_auth:nh_auth@localhost:5432/nh_auth`
(trivial, non-secret credentials — this is a disposable local container,
not anything resembling production data).

**Cloud Postgres (Neon) is reserved for the actually-deployed backend**
once `back/` is live on Railway/Render: `DATABASE_URL` set as an
environment variable in that platform's own dashboard, never committed
here, never needed to run or review this repo locally.

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

## Auth design ("proper, prod-ready JWT flow")

- **Access token**: JWT, short-lived (~15 min), claims `sub` (user id),
  `iat`, `exp`. Stateless — validated by signature + expiry only, no DB
  hit on every request.
- **Refresh token**: an **opaque random token**
  (`secrets.token_urlsafe(32)`), *not* a JWT — it's validated by DB lookup
  anyway, so there's no benefit to it being self-describing, and opaque
  tokens are the standard choice for refresh tokens specifically. Only its
  SHA-256 hash is stored (defense in depth if the DB ever leaks).
  Delivered as an `httpOnly`, `Secure`, `SameSite=None` cookie, path-scoped
  to `/auth/refresh` so it's never sent to unrelated endpoints.
- **Rotation**: every `/auth/refresh` call deletes the old refresh-token
  row and issues a new one (+ new access token). This is what makes
  logout/account-delete meaningful, since a JWT can't be un-issued.
- **Logout**: requires a valid access token (same as account delete);
  deletes the caller's refresh-token row(s) by `user_id` and clears the
  cookie. Any already-issued access token stays valid until its own short
  expiry — standard, accepted tradeoff.
- **Account delete**: requires a valid access token; deletes the user row,
  cascading to their refresh-token row(s).
- **CORS**: `front/` (Vercel) and `back/` (Railway/Render) are different
  domains, so cross-origin cookies are required:
  `CORSMiddleware(allow_origins=[<front URL>], allow_credentials=True)` —
  no wildcard origin once credentials are involved — and the frontend must
  send `credentials: 'include'`.
- **Known gap, deliberately deferred**: no brute-force/rate-limiting on
  `/auth/login` yet. Keeping v1 scope to what was asked
  (register/login/logout/delete). This is a visible, intentional decision,
  not an oversight — revisit before this goes anywhere near real users.

## Input validation

Email/password rules live in `app/schemas/auth.py` (Pydantic field
constraints + `field_validator`s). They're mirrored by hand in
[`../docs/auth-validation.md`](../docs/auth-validation.md) for `front/` to
read, since the two apps share no code — **update that file in the same
change** whenever `app/schemas/auth.py`'s rules change.

## Schema

- `users`: `id` (uuid pk), `email` (unique, normalized lowercase),
  `password_hash`, `created_at`.
- `refresh_tokens`: `id` (uuid pk), `user_id` (fk, `ON DELETE CASCADE`),
  `token_hash`, `expires_at`, `created_at`.

## Endpoints

`POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`,
`POST /auth/logout`, `GET /users/me`, `DELETE /users/me`.

`GET /users/me` exists specifically so `front/`'s "logged in" placeholder
page has something real to show.

## Layout

```
back/app/
  main.py            # FastAPI app, CORS, router registration
  core/config.py     # pydantic-settings
  core/security.py   # argon2 hashing, PyJWT encode/decode, refresh token helpers
  db/session.py      # async engine + session factory
  models/            # SQLAlchemy models (base, user, refresh_token)
  schemas/           # Pydantic request/response models (auth, user)
  api/cookies.py     # refresh-token cookie set/clear helpers (shared by auth + users routes)
  api/deps.py        # get_current_user dependency, DbSession/CurrentUser aliases
  api/routes/auth.py # register/login/refresh/logout
  api/routes/users.py# me / delete
back/alembic/        # env.py wired to app.core.config + app.models.Base
back/tests/          # pytest + httpx.AsyncClient, in-memory SQLite via get_db override
```
