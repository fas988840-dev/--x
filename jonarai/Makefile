# JONARAI dev commands.
#
# Run `make help` for the list. All targets are safe to run in a fresh
# checkout — none of them require an API key or a live provider.

SHELL := bash

.DEFAULT_GOAL := help

.PHONY: help
help:  ## Show this help
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*##/ { \
		printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

# ------------------------------------------------------------------
# Setup
# ------------------------------------------------------------------

.PHONY: setup
setup: setup-backend setup-frontend  ## Install every dev dependency

.PHONY: setup-backend
setup-backend:  ## Install backend deps (in a venv)
	cd backend && \
		python3.12 -m venv .venv && \
		. .venv/bin/activate && \
		pip install --upgrade pip && \
		pip install -e '.[dev]'

.PHONY: setup-frontend
setup-frontend:  ## Install frontend deps
	cd frontend && npm install

# ------------------------------------------------------------------
# Quality
# ------------------------------------------------------------------

.PHONY: lint
lint: lint-backend lint-frontend  ## Lint everything

.PHONY: lint-backend
lint-backend:  ## Ruff lint backend
	cd backend && ruff check src tests && ruff format --check src tests

.PHONY: lint-fix
lint-fix:  ## Ruff auto-fix backend
	cd backend && ruff check --fix src tests && ruff format src tests

.PHONY: lint-frontend
lint-frontend:  ## ESLint frontend
	cd frontend && npm run lint

.PHONY: typecheck
typecheck: typecheck-backend typecheck-frontend  ## Typecheck everything

.PHONY: typecheck-backend
typecheck-backend:  ## mypy backend
	cd backend && mypy src

.PHONY: typecheck-frontend
typecheck-frontend:  ## tsc --noEmit frontend
	cd frontend && npm run typecheck

.PHONY: test
test: test-backend  ## Run backend tests (frontend tests land Phase Z)

.PHONY: test-backend
test-backend:  ## pytest backend
	cd backend && pytest -v

.PHONY: check
check: lint typecheck test  ## Full pre-commit check

# ------------------------------------------------------------------
# Runtime
# ------------------------------------------------------------------

.PHONY: dev-backend
dev-backend:  ## Run backend with reload on :8000
	cd backend && uvicorn jonarai.api.main:app --reload --port 8000

.PHONY: dev-frontend
dev-frontend:  ## Run frontend dev server on :3000
	cd frontend && npm run dev

# ------------------------------------------------------------------
# Database (local dev)
# ------------------------------------------------------------------

.PHONY: db-up
db-up:  ## Start local Postgres+Timescale (docker compose)
	docker compose -f infrastructure/docker-compose.dev.yml up -d

.PHONY: db-down
db-down:  ## Stop local Postgres+Timescale (keeps volume)
	docker compose -f infrastructure/docker-compose.dev.yml down

.PHONY: db-nuke
db-nuke:  ## Stop + delete the local DB volume
	docker compose -f infrastructure/docker-compose.dev.yml down -v

# ------------------------------------------------------------------
# Docker (backend image)
# ------------------------------------------------------------------

.PHONY: docker-build
docker-build:  ## Build the backend Docker image (jonarai-backend:dev)
	docker build -f infrastructure/Dockerfile.backend -t jonarai-backend:dev .

.PHONY: docker-run
docker-run:  ## Run the backend Docker image on :8000
	docker run --rm -p 8000:8000 jonarai-backend:dev
