# nh-auth

A register/login/account flow built as a learning and recruitment kata.
Monorepo with two independent apps: a Nuxt frontend (`front/`) and a
FastAPI backend (`back/`). See [`CLAUDE.md`](CLAUDE.md) and the
per-module `front/CLAUDE.md` / `back/CLAUDE.md` for the architecture and
the reasoning behind it.

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
```

Starts a local Postgres container (`docker compose`). `.env` already
points at it — nothing to edit for local dev. Stop it later with
`make db-down`.

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
