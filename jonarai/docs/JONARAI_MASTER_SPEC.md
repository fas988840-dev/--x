# JONARAI — MASTER SPECIFICATION

> **Status:** 🟡 PARTIAL — this document is the authoritative source of truth
> for JONARAI. It is currently under construction by ChatGPT (Product/Trading
> Intelligence Architect) and Claude may not implement anything beyond what is
> explicitly written here.

---

## 0. Document Identity

- **Product name:** JONARAI
- **Product type:** SPX / SPXW 0DTE Options Trading Intelligence Platform
- **Product category:** Read-only intelligence + confidence scoring + trade
  management guidance. Not an execution broker.
- **Owner:** `fas988840-dev`
- **Architect:** ChatGPT (via user relay)
- **Implementer:** Claude (Anthropic)
- **Final decision-maker:** the user (owner)

---

## 1. Sections (composed from separate spec files)

The Master Spec is the union of the following documents. Each is binding on
Claude and must be treated as authoritative.

| # | Section | File | Status |
|---|---------|------|--------|
| 1 | Time / Entry / Trade Management Core | [`JONARAI_TIME_ENTRY_MANAGEMENT_SPEC.md`](./JONARAI_TIME_ENTRY_MANAGEMENT_SPEC.md) | ✅ RECEIVED |
| 2 | Data Master (fields, sources, licensing) | [`JONARAI_DATA_MASTER.md`](./JONARAI_DATA_MASTER.md) | ⏳ AWAITING |
| 3 | Multi-Timeframe (MTF) Rules | *inside DATA_MASTER or separate file TBD* | ⏳ AWAITING |
| 4 | Options Flow Classification Logic | *TBD* | ⏳ AWAITING |
| 5 | Gamma Engine (GEX/DEX/VEX/CHEX formulas) | *TBD* | ⏳ AWAITING |
| 6 | Volatility Engine (IV / Expected Move / Skew) | *TBD* | ⏳ AWAITING |
| 7 | CVD / VWAP Definitions | *TBD* | ⏳ AWAITING |
| 8 | Market Regime Classification | *TBD* | ⏳ AWAITING |
| 9 | Build Roadmap (A → Z phases) | [`JONARAI_BUILD_ROADMAP.md`](./JONARAI_BUILD_ROADMAP.md) | ✅ RECEIVED (from ChatGPT plan) |

---

## 2. Global Non-Negotiables

These are true for every section, every phase, every module. Claude must
enforce them regardless of what any lower-level document might imply.

### 2.1 Score is NOT probability
The `JONARAI SCORE (0–100)` is a **selectivity score**. It must never be
presented, documented, or coded as a "% chance of profit". Its empirical
meaning is determined only after paper-trading calibration (see Phase Y).

### 2.2 Never `score >= 93 → BUY`
Every entry must pass:
```
Score ≥ threshold
   AND all Mandatory Gates
   AND Time Confirmation
   AND Contract Confirmation
   AND Entry State Machine reached ENTRY
Then Time-to-Prove → Dynamic Profit Lock → Reversal/Exit Monitoring
```

### 2.3 `NO TRADE` is a first-class output
The default answer is silence. Missing a trade is acceptable; a marginal
trade is not.

### 2.4 Determinism + Reasoning
Every score, every gate, every classification output must be deterministic
(same inputs → same outputs) and paired with a `reasoning[]` list explaining
which factors drove the result.

### 2.5 Read-only until proven
- No live IBKR execution before paper-trading calibration completes.
- No writes to a broker API until an explicit "kill switch + risk limits"
  layer is in place and tested.
- No storage of user broker credentials in cleartext, ever.

### 2.6 Data integrity first
Critical data failure (stale quotes, missing fields, provider disagreement,
websocket disconnected) → `ENTRY_DISABLED = TRUE`. An existing position
switches to a predefined safe-management policy.

### 2.7 No hidden LLM in the scoring loop
LLMs may only be used for **rephrasing** already-computed deterministic
facts (see FactLedger's `ChainGptClient` pattern). An LLM is never a source
of a new number that goes into the score.

### 2.8 Every user-facing output carries a disclaimer
"JONARAI outputs are trading intelligence, not financial advice. Options
trading carries substantial risk of loss."

---

## 3. Division of Labor (frozen)

| Role | Responsibilities | Boundaries |
|------|------------------|------------|
| **ChatGPT (Architect)** | Product logic · Trading logic · Data Master · MTF rules · Options logic · Scoring formula · Contract selection · Risk logic · Testing methodology · Final logic sign-off | Does not write production code · Does not merge PRs |
| **Claude (Implementer)** | Backend · Frontend · Database · APIs · WebSockets · Infrastructure · Tests · Refactoring · Documentation · Deployment scripts | Does not change trading logic on its own · Does not open Phase N+1 before Phase N is accepted · Does not collapse the entry pipeline · May only *suggest* logic changes for architect review |
| **User (Owner)** | Accounts · API subscriptions · Cloud/GitHub admin · Commercial licenses · Product decisions · Final approval per phase | — |

**Handshake rule:** No phase advances without an explicit `"A ✅"`,
`"B ✅"`, etc., from the user.

---

## 4. Phase Acceptance (Definition of Done)

Each phase in `JONARAI_BUILD_ROADMAP.md` carries its own DoD. A phase is
considered done only when **all** of the following are true:

- All files listed in the phase's DoD exist and are committed.
- All tests listed in the phase's DoD pass locally and in CI.
- The architect (ChatGPT via user) has reviewed and signed off.
- The next phase's prerequisites (per the roadmap) are documented.

Any deviation from the phase spec — however "obvious" — is a change request,
not an implementation detail.

---

## 5. What's currently RECEIVED vs. AWAITING

**RECEIVED (safe to reference in code once implementation begins):**
- Time Intelligence engine spec (P0)
- Time-to-Prove engine spec
- Entry Quality Score component list (weights TBD)
- Elite Entry Gate list
- Contract Selection Engine field list
- Entry State Machine (SCAN → WATCH → ARMED → CONFIRMED → ENTRY → MANAGE → EXIT)
- Target / Stop / Trailing / Profit-Lock / Early-Exit / Reversal Anticipation engines
- No-Trade veto conditions
- Data Integrity Failsafe rules
- Performance Calibration bucket structure (80–84, 85–89, 90–92, 93–95, 96–97, 98–100)
- Development priority order (P0/P1/P2)

**AWAITING (Claude must NOT invent):**
- Concrete data field list, source per field, licensing per source
- Concrete MTF alignment rules (how exactly Weekly → Daily → 1H → 15M → 5M is combined into a score)
- Concrete flow classification thresholds
- Concrete gamma level formulas
- Concrete score weights (the components are known; the weights are not)

See `docs/BLOCKED_ON_ARCHITECT.md` for the fully enumerated list of
architect blockers (one item per phase, with the exact question that
must be answered).

**CLAUDE-SELECTED DEFAULTS (reversible, documented in `docs/TECH_STACK_DECISION.md`):**
- Backend: Python 3.12 + FastAPI + SQLAlchemy 2.0 async + asyncpg + Alembic
- Backend quality: ruff + mypy --strict + pytest + hypothesis
- Frontend: Next.js 14 App Router + TypeScript + Tailwind (was spec-mandated; Claude picked scaffold shape)
- Local DB: PostgreSQL 16 + TimescaleDB 2.16 via docker-compose.dev.yml

Everything above lives under `jonarai/` per Phase A.1 scaffold and can
be replaced without touching any trading logic (there isn't any yet).

---

_Master Spec assembly in progress. Update this file whenever a new authoritative
section arrives from ChatGPT — do not overwrite prior sections._
