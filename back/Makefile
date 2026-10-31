.PHONY: dev start db-up db-down migrate test lint lint-fix format format-check

PORT ?= 8000

dev:
	uv run uvicorn app.main:app --reload

start:
	uv run alembic upgrade head && uv run uvicorn app.main:app --host 0.0.0.0 --port $(PORT)

db-up:
	docker compose up -d

db-down:
	docker compose down

migrate:
	uv run alembic upgrade head

test:
	uv run pytest

lint:
	uv run ruff check .

lint-fix:
	uv run ruff check --fix .

format:
	uv run ruff format .

format-check:
	uv run ruff format --check .
