# JONARAI

**SPX / SPXW 0DTE Options Trading Intelligence.**
Selectivity-first. Time as a P0 signal. Confidence score, not probability.

> **Status:** 🅰️ Phase A.1 — Scaffold + runnable health-check only.
>
> The backend has a real FastAPI app whose only meaningful endpoint is
> `GET /health`. Every trading engine is a stub that raises
> `SpecNotYetProvidedError` — this is **enforced** by a test suite
> (`backend/tests/test_engines_are_stubs.py`) that fails the moment
> anyone slips in a fabricated number.
>
> The frontend is a Next.js 14 holding page that refuses to render a
> fabricated dashboard.
>
> Phase B (Data Master) is deliberately blocked until the architect
> delivers the field enumeration and licensing decisions
> (see `docs/BLOCKED_ON_ARCHITECT.md`).

---

## What JONARAI is

JONARAI answers five questions before a trade — and treats the default
answer as `NO TRADE`:

1. **WHEN** the market condition (time of day, session regime, theta &
   gamma environment) actually favors a trade at all.
2. **WHETHER** every mandatory gate confirms (MTF, Flow, Gamma, Liquidity,
   CVD, VWAP, Momentum, Spread, Contract liquidity, R/R, Reversal-risk,
   Time-risk).
3. **WHICH** SPXW 0DTE contract is the best executable choice given
   spread, OI, greeks, and slippage.
4. **WHERE** to enter, where the thesis is invalid, and where to take profit.
5. **WHEN** to trail the stop, protect profit, and exit early if evidence
   of deterioration appears — before unnecessary giveback.

---

## Non-negotiables

- **The JONARAI score is 0–100 selectivity, NOT probability of profit.**
  Its empirical meaning per bucket (80–84 / 85–89 / 90–92 / 93–95 / 96–97 /
  98–100) is established only after paper-trading calibration.
- **`NO TRADE` is a first-class output.** Missing a trade is acceptable;
  taking an unqualified trade is not.
- **No `if score >= 93: BUY`.** The pipeline is always
  `Score → Mandatory Gates → Time Confirmation → Contract Confirmation →
  Entry → Time-to-Prove → Dynamic Profit Lock → Reversal/Exit Monitoring`.
- **No live IBKR execution before paper-trading calibration**, and never
  without a Kill-Switch + Risk-Limits layer.
- **Read-only until proven.** No storage of broker credentials in
  cleartext, ever.
- **Every scoring output is deterministic** and carries a `reasoning[]`
  list explaining which factors drove the score.

---

## Repository layout (Phase A)

```
jonarai/
├── backend/                    # Python 3.12 · FastAPI · Engine stubs
│   ├── pyproject.toml
│   ├── src/jonarai/
│   │   ├── config.py           # env-driven settings
│   │   ├── domain/             # entities, errors (pure data)
│   │   ├── engines/            # 16 Engine stubs — all raise SpecNotYetProvidedError
│   │   ├── providers/          # DataProvider ABC + empty registry
│   │   └── api/main.py         # FastAPI app — /health responds
│   └── tests/                  # guardrail-enforcing pytest suite
├── frontend/                   # Next.js 14 · TypeScript · Tailwind
│   ├── package.json
│   └── app/                    # one holding page
├── database/
│   ├── README.md               # Alembic bootstrap plan (Phase E)
│   └── migrations/             # empty until Phase E
├── analytics/                  # reserved for Phase F+
├── tests/                      # cross-cutting tests (Phase X+)
├── infrastructure/
│   ├── docker-compose.dev.yml  # Postgres 16 + TimescaleDB 2.16 (local)
│   └── Dockerfile.backend      # multi-stage image for the FastAPI app
├── docs/
│   ├── JONARAI_MASTER_SPEC.md               # spec index
│   ├── JONARAI_TIME_ENTRY_MANAGEMENT_SPEC.md # binding (from architect)
│   ├── JONARAI_DATA_MASTER.md               # placeholder (awaiting architect)
│   ├── JONARAI_BUILD_ROADMAP.md             # phase A → Z
│   ├── TECH_STACK_DECISION.md               # Claude-selected defaults (reversible)
│   ├── BLOCKED_ON_ARCHITECT.md              # what the architect owes us
│   └── CLAUDE_AUTONOMOUS_WORK_LOG.md        # transparency log
├── .github/workflows/ci.yml    # CI template (activates on repo migration)
├── Makefile                    # dev commands (setup, lint, test, db-up, ...)
├── CLAUDE.md                   # rules for Claude Code sessions
├── README.md                   # this file
└── .gitignore
```

---

## Roadmap

See [`docs/JONARAI_BUILD_ROADMAP.md`](./docs/JONARAI_BUILD_ROADMAP.md).

Phases are strictly ordered: A → B → C → … → Z. No phase begins until the
previous one is signed off with an explicit `"N ✅"`.

Current gate: Phase A → Phase B requires (a) architect to deliver
`JONARAI_DATA_MASTER.md` content, and (b) user approval `"A ✅"`.

---

## Working model

| Who | Role |
|-----|------|
| **ChatGPT** | Architect — product logic, trading logic, spec authorship, methodology review. |
| **Claude** | Implementer — code, infrastructure, tests, docs. |
| **Owner (user)** | Final decision-maker — accounts, licenses, phase approvals. |

Details in [`CLAUDE.md`](./CLAUDE.md).

---

## Disclaimer

JONARAI outputs are **trading intelligence, not financial advice.** Options
trading — and 0DTE options in particular — carry substantial risk of loss.
Nothing generated by this system is a recommendation to buy, sell, or hold
any security. Use at your own risk, and never trade money you cannot afford
to lose.
