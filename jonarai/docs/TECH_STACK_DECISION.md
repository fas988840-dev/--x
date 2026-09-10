# JONARAI — TECH STACK DECISION LOG

> **Status:** 🟨 Claude-selected defaults, **reversible on architect direction.**
>
> The architect (ChatGPT) has not committed to a specific backend language or
> ORM/framework. Because these choices are needed to write anything at all,
> Claude is picking defensible defaults and documenting them here. If the
> architect prefers different choices, this file is the single place to
> reverse — every downstream file references the stack by convention, not
> by hardcoded assumption.

---

## 1. Backend Language: **Python 3.12**

**Rationale:**
- The trading/quant ecosystem in Python is unmatched: `numpy`, `pandas`,
  `scipy`, `numba`, `pyarrow`, `duckdb`, `polars`, `statsmodels`,
  `ib_insync` (if IBKR is added later per Phase Z), Options-specific libs
  (`py_vollib`, `mibian`), and every serious backtesting framework
  (`vectorbt`, `backtrader`, `zipline`).
- FactLedger (this repo's other product) is TypeScript — deliberately
  keeping JONARAI in a different stack prevents accidental cross-imports
  and reflects the different domain.
- Type safety is preserved via `mypy --strict` and `pydantic`.

**Reversal cost if the architect prefers TypeScript/Rust/Go:** medium.
The engine ABCs would need to be redefined in the new language, but no
business logic exists yet (Phase A + Phase A.1 scaffold), so no throwaway
work.

## 2. Web Framework: **FastAPI 0.115+**

**Rationale:**
- Async by default (matches WebSocket ingestion in Phase D).
- Pydantic v2 → free OpenAPI docs, free request/response validation.
- Runs behind `uvicorn`, deploys anywhere.

## 3. Database: **PostgreSQL 16 + TimescaleDB 2.15+**

**Rationale (spec-defined):** The architect's Phase E roadmap explicitly
names this. Not a Claude choice.

**Migration tool:** **Alembic** — SQLAlchemy-standard, works cleanly with
async engines, has a stable Postgres/Timescale story.

## 4. DB Driver: **asyncpg** (via SQLAlchemy 2.0 async)

**Rationale:** highest-throughput Postgres driver in Python; SQLAlchemy 2.0
async gives us portable query building and Alembic integration in one.

## 5. Frontend: **Next.js 14 (App Router) + TypeScript + Tailwind**

**Rationale (spec-defined):** The architect's Phase Z roadmap explicitly
names this. Not a Claude choice.

**iPad-first:** Tailwind's responsive utilities + `viewport-fit=cover`
in the root layout. No fixed pixel widths.

## 6. Package / Dependency Management

| Layer | Tool | Why |
|-------|------|-----|
| Backend | `uv` (or `pip` fallback) with `pyproject.toml` (PEP 621) | Fast, deterministic locks; `pyproject.toml` is the ecosystem standard |
| Frontend | `pnpm` (or `npm` fallback) with `package.json` | Fast, disk-efficient; drop-in for `npm ci` in CI |

## 7. Quality Gates

| Tool | Purpose |
|------|---------|
| `ruff` | Backend lint + format (replaces black + isort + flake8) |
| `mypy --strict` | Backend types |
| `pytest` + `pytest-asyncio` + `pytest-cov` | Backend tests |
| `hypothesis` | Property-based tests for deterministic engines |
| `eslint` + `prettier` | Frontend lint + format |
| `tsc --noEmit` | Frontend types |
| `vitest` | Frontend unit tests |
| `playwright` | Frontend e2e (Phase Z only) |

## 8. Local Dev

- **Docker Compose** for Postgres+Timescale locally
  (`infrastructure/docker-compose.dev.yml`).
- **`Makefile`** at `jonarai/Makefile` exposing the ~10 dev commands
  (`make setup`, `make test`, `make lint`, `make db-up`, etc.).
- Backend runs directly via `uvicorn` in a Python venv — no need to
  containerize during development.

## 9. Deployment (Phase Z only)

Not decided. Options include Railway, Render, Fly.io, AWS Fargate. Left
open until the architect signs off on Phase Z hosting.

## 10. Explicit non-choices

Claude has **NOT** decided any of the following — the architect owns them
and Claude will not pick defaults:

- Real-time data provider (ThetaData vs. Polygon vs. Databento vs. custom).
- LLM provider or role (if any).
- Broker (IBKR is roadmapped but not chosen for MVP).
- Message bus (Kafka? Redis Streams? None?).
- Any score weight, threshold, or trading-logic constant.

---

## Reversal instructions

If the architect prefers a different stack element:

1. Update the relevant row in this file.
2. Update `pyproject.toml` (or `package.json`) accordingly.
3. Regenerate scaffolding: `make reset-scaffold` (to be provided in the
   Makefile).
4. No business logic exists yet, so no code is thrown away.
