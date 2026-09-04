# JONARAI Database

**PostgreSQL 16 + TimescaleDB 2.15+.** Scaffold only — Phase A.1.
Migrations live under `migrations/`, driven by Alembic.

## Why Alembic

- SQLAlchemy 2.0 async is our runtime ORM (see `backend/pyproject.toml`).
- Alembic auto-generates migration diffs from the SQLAlchemy models we'll
  add in Phase E.
- Works cleanly with TimescaleDB: hypertables and continuous aggregates
  are declared in migration `op.execute("SELECT create_hypertable(...)")`
  blocks alongside the plain `CREATE TABLE` operations.

## Planned tables (from `docs/JONARAI_BUILD_ROADMAP.md` Phase E)

None of these exist yet — this list is the target for Phase E.

| Table | Type | Notes |
|-------|------|-------|
| `spx_ticks` | hypertable (time) | SPX print-level data |
| `spx_bars` | hypertable (time) | multi-timeframe OHLCV bars |
| `options_quotes` | hypertable (time) | per-contract quotes |
| `options_trades` | hypertable (time) | per-contract trades |
| `options_chain` | regular table | rolling snapshot for scan |
| `greeks` | hypertable (time) | Δ Γ Θ ν ρ Vanna Charm |
| `flow` | hypertable (time) | classified flow prints |
| `gex`, `dex`, `vanna`, `charm` | hypertable (time) | dealer-positioning series |
| `volatility` | hypertable (time) | ATM IV, Rank, Percentile, Skew, ... |
| `market_regime` | hypertable (time) | classification per bar |
| `signals` | hypertable (time) | JONARAI candidate signals |
| `contracts` | regular table | active contract identities |
| `trades` | regular table | executed / paper-traded fills |
| `backtests` | regular table | backtest runs + metadata |

Column definitions land only after the architect signs off on the Data
Master (see `docs/BLOCKED_ON_ARCHITECT.md`). Migrations that would
guess column shapes will not be committed.

## Local dev

Bring the DB up with:

```bash
docker compose -f jonarai/infrastructure/docker-compose.dev.yml up -d
```

Then run migrations (once any exist) with:

```bash
cd jonarai/backend
alembic upgrade head
```

## Bootstrap sequence (when Phase E begins)

1. `cd jonarai/backend && alembic init ../database/migrations`
2. Point `alembic.ini` at `../database/migrations`.
3. Wire `env.py` to load `jonarai.config.Settings.database_url`.
4. Add SQLAlchemy models under `src/jonarai/persistence/models.py` — one
   per table above, only after the Data Master defines the fields.
5. `alembic revision --autogenerate -m "phase E: initial schema"`, then
   review the generated migration (add `create_hypertable(...)` calls,
   check indices), then `alembic upgrade head`.

None of that runs today. This README exists so the next session doesn't
have to re-derive the plan.
