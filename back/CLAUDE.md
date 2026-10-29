# back

FastAPI app, managed with `uv`, Python 3.13. See root
[`CLAUDE.md`](../CLAUDE.md) for monorepo/deployment context.

## Status

Empty working scaffold only: `app/main.py` is a bare `FastAPI()` instance
with zero routes of our own — verified by hitting the framework's
auto-generated `/docs` and `/openapi.json`. **No database, no models, no
endpoints, no auth yet.** Everything below this line is the *agreed design*
for the next pass, recorded now so it doesn't have to be re-derived — it
is not yet implemented.

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
needs reformatting).

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
- **Logout**: delete the caller's refresh-token row + clear the cookie.
  Any already-issued access token stays valid until its own short expiry —
  standard, accepted tradeoff.
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

## Schema

- `users`: `id` (uuid pk), `email` (unique, normalized lowercase),
  `password_hash`, `created_at`.
- `refresh_tokens`: `id` (uuid pk), `user_id` (fk, `ON DELETE CASCADE`),
  `token_hash`, `expires_at`, `created_at`.

## Endpoints (planned)

`POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`,
`POST /auth/logout`, `GET /users/me`, `DELETE /users/me`.

`GET /users/me` exists specifically so `front/`'s "logged in" placeholder
page has something real to show.

## Layout (planned, grows incrementally)

```
back/app/
  main.py            # FastAPI app, CORS, router registration
  core/config.py     # pydantic-settings
  core/security.py   # argon2 hashing, PyJWT encode/decode
  db/session.py      # async engine + session factory
  models/            # SQLAlchemy models (user, refresh_token)
  schemas/           # Pydantic request/response models
  api/routes/auth.py # register/login/refresh/logout
  api/routes/users.py# me / delete
  api/deps.py        # get_current_user dependency
back/alembic/
back/tests/
```
