# back

FastAPI auth service — register/login/refresh/logout + account deletion,
JWT access tokens with rotating opaque refresh tokens. Managed with `uv`,
Python 3.13. See root [`CLAUDE.md`](../CLAUDE.md) for monorepo/deployment
context and [`CLAUDE.md`](CLAUDE.md) for the full design rationale.

## Local setup

```sh
cp .env.example .env   # then fill in JWT_SECRET_KEY, adjust CORS_ORIGIN if needed
make db-up              # start local Postgres (Docker Compose)
make migrate            # apply schema
make dev                # run the API with reload, on http://localhost:8000
```

## Tests

```sh
make test
```

Tests run against an in-memory SQLite DB (via a `get_db` dependency
override) and don't need Postgres running.
