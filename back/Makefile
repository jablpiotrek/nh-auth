.PHONY: dev db-up db-down lint lint-fix format format-check

dev:
	uv run uvicorn app.main:app --reload

db-up:
	docker compose up -d

db-down:
	docker compose down

lint:
	uv run ruff check .

lint-fix:
	uv run ruff check --fix .

format:
	uv run ruff format .

format-check:
	uv run ruff format --check .
