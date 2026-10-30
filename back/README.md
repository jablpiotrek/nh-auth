# back

FastAPI service behind nh-auth: registration, login, session refresh,
logout, and a small account endpoint. JWT access tokens + rotating opaque
refresh tokens, Postgres via SQLAlchemy 2.0 async, migrations via Alembic.
Managed with `uv`, Python 3.13.

See the root [`README.md`](../README.md) for monorepo layout and how to run
this alongside `front/`, and [`CLAUDE.md`](CLAUDE.md) for *why* specific
libraries/platforms were picked over alternatives, deployment details, and
current status.

## Local setup

```sh
cp .env.example .env   # then fill in JWT_SECRET_KEY, adjust CORS_ORIGIN if needed
make db-up              # start local Postgres (Docker Compose)
make migrate            # apply schema
make dev                # run the API with reload, on http://localhost:8000
```

Interactive API docs (Swagger UI) at `http://localhost:8000/docs` once it's
running.

## Tests

```sh
make test
```

Runs `pytest` + `httpx.AsyncClient` against the real FastAPI app, with
`get_db` overridden to an in-memory SQLite database — no Postgres needed to
run the suite. Covers all six endpoints: register (incl. duplicate email,
default/explicit `subscribed`), login (incl. wrong password/unknown email),
refresh (incl. rotation, expiry, reuse of an already-rotated token), logout,
and `GET`/`PATCH /users/me`.

## Tech stack

| Concern              | Choice                                  | Role |
| -------------------- | ---------------------------------------- | ---- |
| Web framework        | **FastAPI**                              | Routing, request/response validation via Pydantic, auto-generated OpenAPI docs. |
| ORM / DB driver       | **SQLAlchemy 2.0 (async)** + **asyncpg** | One async engine + session factory shared for the app's lifetime (`db/session.py`). |
| Migrations           | **Alembic**                              | Schema versioning, wired to the SQLAlchemy models and settings (`alembic/env.py`). |
| Request/response schemas | **Pydantic v2**                      | `app/schemas/` — field constraints, custom validators, normalization. |
| Config               | **pydantic-settings**                    | `app/core/config.py` — typed settings loaded from `.env`/real env vars. |
| Password hashing     | **argon2-cffi** (Argon2id)                | `core/security.py` — OWASP's current recommended hash. |
| Access tokens         | **PyJWT**                                | `core/security.py` — HS256 encode/decode, explicit algorithm allow-list. |
| Tests                | **pytest** + **httpx.AsyncClient**       | Against the real app, in-memory SQLite. |

## Data model / DB schema

Two tables (`alembic/versions/..._create_users_and_refresh_tokens_tables.py`,
with a follow-up migration `..._add_subscribed_to_users.py` adding
`subscribed`):

**`users`** (`app/models/user.py`)

| Column          | Type                        | Notes |
| --------------- | --------------------------- | ----- |
| `id`            | `uuid`, PK                  | `default=uuid.uuid4`, generated app-side. |
| `email`         | `varchar(320)`, unique, indexed | Normalized (trimmed + lowercased) before every read/write — see `schemas/auth.py`. |
| `password_hash` | `varchar(255)`              | Argon2id hash, never the raw password. |
| `subscribed`    | `boolean`, default `false`  | "Send me notifications" opt-in; settable at register or via `PATCH /users/me`. |
| `created_at`    | `timestamptz`               | `server_default=now()` — set by Postgres, not app code. |

**`refresh_tokens`** (`app/models/refresh_token.py`)

| Column        | Type                        | Notes |
| ------------- | ---------------------------- | ----- |
| `id`          | `uuid`, PK                   | |
| `user_id`     | `uuid`, FK → `users.id`, `ON DELETE CASCADE`, indexed | Deleting a user row (if that ever happens) cleans up its tokens automatically. |
| `token_hash`  | `varchar(64)`, unique, indexed | **SHA-256 hex digest of the raw opaque token** — the raw token itself is never stored. |
| `expires_at`  | `timestamptz`                | Checked DB-side (`expires_at > now()`), not against the app's clock. |
| `created_at`  | `timestamptz`                | `server_default=now()`. |

`User.refresh_tokens` is a one-to-many relationship with
`cascade="all, delete-orphan"`.

## JWT & session design

- **Access token** — a JWT (HS256), claims `sub` (user id), `iat`, `exp`.
  Short-lived (`ACCESS_TOKEN_EXPIRE_MINUTES`, default 15 min). Validated by
  signature + expiry only (`core/security.py:decode_access_token`,
  `algorithms=["HS256"]` pinned explicitly) — **no database hit** on every
  authenticated request, which is the whole point of using a JWT here.
- **Refresh token** — an **opaque random string**
  (`secrets.token_urlsafe(32)`, `core/security.py:generate_refresh_token`),
  deliberately *not* a JWT: it's validated by a DB lookup either way, so a
  self-describing token buys nothing, and opaque tokens are the standard
  choice for refresh tokens specifically. Only its SHA-256 hash
  (`hash_refresh_token`) is ever persisted, so a leaked database doesn't
  hand over usable tokens directly.
- **Delivery** — the refresh token is set as an `httpOnly`, `Secure`,
  `SameSite=None` cookie, **path-scoped to `/auth/refresh`**
  (`api/cookies.py`). Browsers only ever attach it to that one endpoint —
  it's invisible to JavaScript and to every other route.
- **Rotation** — every successful `/auth/refresh` call deletes the
  consumed token row and issues a brand-new refresh token *and* access
  token (the shared `_issue_tokens()` helper in `api/routes/auth.py`, used
  by register, login, and refresh alike). This is what makes logout
  meaningful at all, since a JWT itself can't be revoked before it expires.
- **Expiry** — refresh tokens live `REFRESH_TOKEN_EXPIRE_DAYS` (default 30
  days), checked against Postgres's own clock at lookup time.

## End-to-end flows

Each flow traced from the HTTP endpoint down to the database.

### `POST /auth/register`

1. `api/routes/auth.py:register()` receives a `RegisterRequest`
   (`schemas/auth.py`) — Pydantic validates/normalizes email and password
   complexity before the handler body even runs (full rules in
   [`../docs/auth-validation.md`](../docs/auth-validation.md)).
2. Looks up an existing `User` by the normalized email
   (`select(User).where(User.email == body.email)`); if found, raises
   `409 errors.auth.emailTaken`.
3. Hashes the password with Argon2id (`core/security.py:hash_password`),
   builds a `User` row, `db.add()` + `db.flush()` — this assigns the
   generated UUID without committing yet.
4. Calls `_issue_tokens()`: generates an opaque refresh token, inserts a
   `RefreshToken` row holding its SHA-256 hash, `db.commit()`s the user and
   the token together in one transaction, sets the refresh cookie on the
   response, and signs a fresh access token.
5. Responds `201 {"access_token", "token_type": "bearer"}`; the refresh
   cookie travels alongside it.

### `POST /auth/login`

1. `login()` looks up the `User` by normalized email.
2. `core/security.py:verify_password` checks the Argon2id hash. A missing
   user and a wrong password both raise the **same** `401
   errors.auth.invalidCredentials` — deliberately indistinguishable, so a
   caller can't use the error to enumerate which accounts exist.
3. Same `_issue_tokens()` helper as register: new refresh-token row +
   cookie, new access token.

### `POST /auth/refresh`

1. Reads the raw refresh token from the `refresh_token` cookie
   (`request.cookies.get(...)`) — present only because the browser is
   calling this exact path. Missing → `401 errors.auth.sessionExpired`.
2. Hashes it and looks up a `RefreshToken` row by `token_hash` where
   `expires_at > now()`. Not found or expired → clears the cookie and
   raises the same 401.
3. Loads the owning `User` by `token_row.user_id` (also 401s + clears the
   cookie if the user somehow no longer exists).
4. **Deletes the consumed token row** (`db.delete()` + `flush()`) — this is
   the rotation step — then calls `_issue_tokens()` again for a fresh pair.

### `POST /auth/logout`

1. Requires a valid access token via the `CurrentUser` dependency
   (`api/deps.py:get_current_user` — decodes the JWT, loads the `User` row;
   anything invalid/missing/expired is `401 errors.auth.unauthorized`).
2. Deletes **every** `refresh_tokens` row for that `user_id` (not a lookup
   by the refresh cookie — see deviation below) and clears the cookie.
   Responds `204`.
3. Any access token already handed out for this session is *not* revoked
   — it simply expires on its own within its short TTL. Accepted, visible
   trade-off, not an oversight.

> **Deviation from "look up by refresh cookie":** the refresh cookie's
> `Path=/auth/refresh` scoping means the browser never attaches it to a
> `/auth/logout` request at all, so logout couldn't identify the caller
> that way regardless of intent. Identifying the caller via their access
> token and deleting their refresh-token row(s) by `user_id` is what this
> endpoint actually does, discovered while implementing.

### `GET /users/me` / `PATCH /users/me`

- `GET` returns the current user (`CurrentUser` dependency) as a
  `UserResponse`. Exists specifically because neither login nor refresh
  returns `subscribed` — the frontend's account page needs a real call to
  show it.
- `PATCH` takes a `UserConfiguration` (`{"subscribed": bool}`), mutates the
  already-loaded `User` row, commits, and returns the updated
  `UserResponse`. Backs the account page's subscription checkbox.

## Request lifecycle (file by file)

```
main.py              FastAPI app instance, CORS middleware, router registration
  → api/routes/auth.py / users.py     endpoint functions
    → api/deps.py                    CurrentUser (JWT → User) / DbSession dependencies
      → core/security.py             password hashing, JWT encode/decode, refresh-token helpers
      → models/*.py                  SQLAlchemy ORM models (User, RefreshToken)
        → db/session.py              async engine + session factory
          → Postgres
```

Supporting files: `core/config.py` (typed env settings), `api/cookies.py`
(refresh-cookie set/clear, shared by all three token-issuing endpoints),
`schemas/*.py` (Pydantic request/response shapes, validation rules).

## CORS & cookies

`front/` (Vercel) and `back/` (Render) are different domains, so every
authenticated call is cross-origin:

```python
CORSMiddleware(allow_origins=[settings.cors_origin], allow_credentials=True)
```

No wildcard origin is possible once `allow_credentials=True` is set — the
frontend must also send `credentials: 'include'` on every request. The
refresh cookie (`httponly`, `secure`, `samesite=none`) requires HTTPS on
both ends in any non-local environment, since browsers reject
`SameSite=None` without `Secure`.

## Input validation

Email/password rules live in `app/schemas/auth.py` (Pydantic field
constraints + `field_validator`s) and are documented in full, with exact
error-response shapes, in
[`../docs/auth-validation.md`](../docs/auth-validation.md) — `front/`
mirrors them by hand there since the two apps share no code.

## Known, deliberate gaps

- No rate limiting / brute-force protection on `/auth/login`.
- No account deletion endpoint (removed from scope; no code path deletes a
  user row).

See [`CLAUDE.md`](CLAUDE.md) for the reasoning behind these and other
decisions, plus deployment details and current implementation status.
