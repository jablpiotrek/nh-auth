# nh-auth

A sample register / login / account application: email+password registration,
login, a persistent session backed by JWT access tokens and rotating refresh
tokens, and a small account page (view email, toggle a "subscribed" flag).
It's built to read like a textbook, production-style auth implementation
rather than a toy — proper password hashing, short-lived access tokens,
httpOnly refresh cookies with rotation, CORS across two separate domains,
real migrations, and a real (if small) test suite on both sides.

## What it does

- **Register** — email + password (with complexity rules) + an optional
  "subscribe to notifications" checkbox.
- **Login** — issues a short-lived JWT access token and a rotating refresh
  token.
- **Session persistence** — the session survives a page reload via a silent
  refresh, without ever putting the access token in browser storage.
- **Logout** — revokes the session server-side.
- **Account page** — shows the logged-in user's email and lets them toggle
  the subscription flag.
- **i18n** — English, Polish, French.

## Architecture (monorepo layout)

Two fully independent apps, different language ecosystems, no shared code
and no monorepo build tool (nothing for one to coordinate):

```
nh-auth/
├── front/   Nuxt 4 app (Vue, client-side rendered) — the UI
├── back/    FastAPI service (Python, uv) — the auth API + Postgres
└── docs/    auth-validation.md — the hand-kept validation contract
             both apps are mirrored against (they share zero code)
```

- **`front/`** → Nuxt 4, Nordhealth design system, Pinia for state, talks to
  `back/` over HTTP with credentials. Deploys to **Vercel**.
- **`back/`** → FastAPI + SQLAlchemy (async) + Postgres, JWT access tokens +
  opaque rotating refresh tokens in an httpOnly cookie. Deploys to **Render**,
  database on **Neon**.

Each app's own `README.md` documents its architecture, technology choices,
and the full register/login/JWT/session flow end to end, file by file:

- **[`front/README.md`](front/README.md)**
- **[`back/README.md`](back/README.md)**

Each app also has a `CLAUDE.md` with the reasoning behind specific
decisions (library picks, platform choices, known trade-offs) for anyone —
human or AI — picking the project back up later.

## Prerequisites

- **Node.js 24** (LTS) and **npm** — `front/.nvmrc` pins the exact tested
  version; `nvm use` inside `front/` picks it up. Required by Nuxt 4.6.3
  itself (Node 20 is not supported)
- **[uv](https://docs.astral.sh/uv/)** — manages the backend's Python
  version and dependencies itself; you don't need Python installed
  separately
- **Docker** and **Docker Compose** — runs local Postgres for the backend
- **make** — runs the backend's dev/lint/format aliases (`back/Makefile`).
  Usually already present on Linux/macOS dev setups; if not, install via
  your package manager (e.g. `apt install make`, `brew install make`)

## Running locally

Three independent steps — backend, its database, and frontend. Each
runs in its own terminal.

### 1. Backend database

```bash
cd back
cp .env.example .env
make db-up
make migrate
```

Starts a local Postgres container (`docker compose`) and applies the
schema. `.env` already points at it — nothing to edit for local dev. Stop
the container later with `make db-down`.

### 2. Backend API

```bash
cd back
make dev
```

`uv` installs dependencies and the matching Python version automatically
on first run. Serves at `http://127.0.0.1:8000` (interactive docs at
`/docs`).

### 3. Frontend

```bash
cd front
cp .env.example .env
npm install
npm run dev
```

Serves at `http://localhost:3000`.

### (Optional) Git hooks

Only needed if you're committing to the repo — sets up the pre-commit
lint/format hooks:

```bash
npm install
```

(run once, from the repo root)

## Testing

- `back/`: `make test` (pytest, in-memory SQLite — no Postgres needed).
- `front/`: `npm run test:unit` (Vitest) and `npm run test:e2e`
  (Playwright).

See each app's `README.md` for what's actually covered.
