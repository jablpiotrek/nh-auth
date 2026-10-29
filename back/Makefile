.PHONY: dev lint lint-fix format format-check

dev:
	uv run uvicorn app.main:app --reload

lint:
	uv run ruff check .

lint-fix:
	uv run ruff check --fix .

format:
	uv run ruff format .

format-check:
	uv run ruff format --check .
