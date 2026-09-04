# JONARAI Backend

Python 3.12 + FastAPI. **Scaffold only — Phase A.1.**

Every engine under `src/jonarai/engines/` raises
`SpecNotYetProvidedError`. This is enforced by
`tests/test_engines_are_stubs.py`, which fails the moment any engine
starts implementing trading logic that the architect hasn't signed off
on. See `../docs/BLOCKED_ON_ARCHITECT.md` for what the architect still
owes us.

## Layout

```
backend/
├── pyproject.toml
├── src/jonarai/
│   ├── config.py                # env-driven settings (Pydantic)
│   ├── domain/
│   │   ├── entities.py          # OptionContract, JonaraiScore, EntrySignal, ...
│   │   └── errors.py            # SpecNotYetProvidedError, DataIntegrityError, ...
│   ├── engines/
│   │   ├── base.py              # Engine ABC
│   │   ├── time_engine.py       # P0
│   │   ├── score_engine.py
│   │   ├── no_trade_engine.py
│   │   ├── entry_engine.py
│   │   ├── exit_engine.py
│   │   ├── mtf_engine.py
│   │   ├── flow_engine.py
│   │   ├── gamma_engine.py
│   │   ├── volatility_engine.py
│   │   ├── regime_engine.py
│   │   ├── liquidity_engine.py
│   │   ├── noise_engine.py
│   │   ├── reversal_engine.py
│   │   ├── profit_lock_engine.py
│   │   ├── contract_ranker.py
│   │   └── data_integrity.py
│   ├── providers/
│   │   ├── base.py              # DataProvider ABC + ProviderCapability
│   │   └── registry.py          # ProviderRegistry (starts empty)
│   └── api/
│       └── main.py              # FastAPI app — only /health and / respond
└── tests/
    ├── test_engines_are_stubs.py  # Guardrail #3 enforcement
    └── test_api_health.py
```

## Setup

```bash
cd jonarai/backend
uv venv                     # or: python3.12 -m venv .venv
source .venv/bin/activate
uv pip install -e '.[dev]'  # or: pip install -e '.[dev]'
```

## Dev commands

Prefer the `Makefile` at `jonarai/Makefile`. The bare tools:

```bash
ruff check src tests
ruff format src tests
mypy src
pytest -v
uvicorn jonarai.api.main:app --reload --port 8000
```

## What you can and cannot do here

- ✅ Add domain entities the architect has named.
- ✅ Refactor engine ABC / stub structure.
- ✅ Add tests that codify guardrails.
- ✅ Add provider *interface* extensions.
- ❌ Implement any engine's `compute` — that requires an architect
  spec resolution (see `../docs/BLOCKED_ON_ARCHITECT.md`).
- ❌ Register any concrete provider adapter — Phase C decision.
- ❌ Hardcode numeric constants that resemble trading logic.
