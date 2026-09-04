# JONARAI — BUILD ROADMAP (A → Z)

> **Status:** ✅ AUTHORITATIVE (from ChatGPT architect's roadmap message).
>
> This is the **only** file that defines phase order. Claude may not skip
> phases, merge phases, or start Phase N+1 before Phase N is signed off by
> the user with `"N ✅"`.

---

## 🧭 Working principle

```
مرحلة → Definition of Done → اختبار → اعتماد المستخدم ✅ → المرحلة التالية
```

No "build the whole thing at once." No jumping. If a proposal to skip appears,
it is a spec violation.

---

## 🅰️ Phase A — Foundation

**Architect (ChatGPT) provides:**
- Product name (`JONARAI`), MVP scope (SPX/SPXW 0DTE), target user, product boundaries.

**Claude implements:**
- Repository skeleton:
  ```
  jonarai/
  ├── backend/
  ├── frontend/
  ├── database/
  ├── analytics/
  ├── tests/
  ├── docs/
  ├── infrastructure/
  └── README.md
  ```

**Phase A Definition of Done:**
- [x] Folder tree exists (each dir has `.gitkeep`)
- [x] `docs/JONARAI_MASTER_SPEC.md` (spec index)
- [x] `docs/JONARAI_TIME_ENTRY_MANAGEMENT_SPEC.md` (from architect)
- [x] `docs/JONARAI_DATA_MASTER.md` (placeholder)
- [x] `docs/JONARAI_BUILD_ROADMAP.md` (this file)
- [x] `CLAUDE.md` with Section-24 guardrails
- [x] `README.md` (status: Phase A, not runnable)
- [x] `.gitignore`

**Output:** JONARAI Repository v0.1 (subfolder in `--x` until standalone repo path is provided).

---

## 🅱️ Phase B — Data Master

**Architect provides:** every field (SPX, SPXW, Options Chain, Greeks, Flow, GEX, DEX, Vanna, Charm, IV, Expected Move, VWAP, CVD, Volume Profile, HVN/LVN, Liquidity, MTF, …) with source, live/historical, websocket/REST, licensing (display / store / derive).

**Claude implements:**
- Fills `DATA_SCHEMA.md`, provider interfaces, DB schema, validation models.

**DoD:** every field has a canonical key, a source, and a licensing decision.

---

## 🅲 Phase C — Data Providers

**Architect provides:** Provider Matrix (primary + backup + licensing per data type).

**Claude implements:** Provider Adapter Layer — provider swap without codebase rebuild. No commercial subscription is signed until architect confirms rights.

**DoD:** at least one live + one backup provider interface implemented per critical data type, all behind adapters.

---

## 🅳 Phase D — Data Ingestion

**Claude implements:** REST + WebSocket, reconnect, heartbeat, rate limit, retry, timestamp normalization, validation.

**Architect reviews:** correctness of data, timestamp, 0DTE isolation, bid/ask sanity, dedup, missing-data handling.

**DoD:** ingestion runs continuously for one full market session without silent data loss.

---

## 🅴 Phase E — Database

**Claude implements:** PostgreSQL + TimescaleDB. Tables: `spx_ticks`, `spx_bars`, `options_quotes`, `options_trades`, `options_chain`, `greeks`, `flow`, `gex`, `dex`, `vanna`, `charm`, `volatility`, `market_regime`, `signals`, `contracts`, `trades`, `backtests`.

**DoD:** migrations + fixtures + a load test showing writes keep up with a live session.

---

## 🅵 Phase F — SPX Engine

**Claude implements:** Price, VWAP, CVD, Volume Delta, Volume Profile, POC, HVN, LVN, Opening Range, Previous High/Low, Liquidity.

**Architect defines:** how each feeds a decision.

**DoD:** deterministic tests (fixed input → fixed output) per computation.

---

## 🅶 Phase G — Options Engine

**Claude implements:** Chain, Strike, Expiry, Call/Put, Premium, IV, Δ, Γ, ν, Θ, ρ, Vanna, Charm.

**Architect defines:** how each Greek is used.

**DoD:** end-to-end read of one live 0DTE chain with Greeks per contract.

---

## 🅷 Phase H — Options Flow

**Claude implements:** Blocks, Sweeps, Large Trades, Buy/Sell inference, Call Premium, Put Premium, Net Premium, Volume Delta, Flow Momentum.

**Architect defines:** Bullish / Bearish / Neutral flow logic.

**DoD:** classifier reproduces architect-provided fixtures 100%.

---

## 🅸 Phase I — Gamma Engine

**Claude implements:** GEX, DEX, VEX, CHEX, Gamma Flip, Call Wall, Put Wall, Gamma Concentration, 0DTE Gamma.

**Architect defines:** when gamma supports the move vs. warns against it.

**DoD:** levels match architect-supplied reference dataset within tolerance.

---

## 🅹 Phase J — Volatility Engine

**Claude implements:** ATM IV, Expected Move, IV Rank, IV Percentile, IV Skew, Term Structure, Realized Volatility, IV Expansion/Compression.

**Architect defines:** Volatility + Options + Time interaction.

**DoD:** IV metrics match a reference oracle within tolerance for one session.

---

## 🅺 Phase K — Multi-Timeframe (MTF) Engine 🔥

Alignment ladder: `WEEKLY → DAILY → 1H → 15M → 5M`.

**Architect defines:** trend, strength, structure, alignment, conflict, pullback, reversal rules.

**Claude implements:** the deterministic engine that outputs `MTF_ALIGNMENT` (0–100).

**DoD:** engine reproduces architect fixtures 100%.

---

## 🅻 Phase L — Market Regime

Classes: `TREND UP`, `TREND DOWN`, `RANGE`, `BREAKOUT`, `REVERSAL`, `GAMMA PIN`, `GAMMA EXPANSION`, `HIGH VOL`, `LOW VOL`.

**Architect defines** the classification logic. **Claude implements** the engine.

**DoD:** classifier is deterministic and emits `reasoning[]` per output.

---

## 🅼 Phase M — Liquidity Intelligence

Inputs: VWAP, POC, HVN, LVN, Gamma Flip, Call Wall, Put Wall, Liquidity Pools, Opening Range, Expected Move, Previous High/Low.

**DoD:** engine outputs a set of interaction zones per session with confidence per zone.

---

## 🅽 Phase N — Scenario Engine

Outputs 🟢 Bull, 🟡 Neutral, 🔴 Bear scenarios, updated as the market moves.

**DoD:** scenarios update on every relevant input change; each carries `reasoning[]`.

---

## 🅾️ Phase O — Noise / Stop-Hunt Engine 🔥

Classifies each move as: `NORMAL_NOISE` / `PULLBACK` / `STOP_HUNT` / `REAL_REVERSAL`.

**DoD:** classifier reproduces architect fixtures for each label.

---

## 🅿️ Phase P — Contract Ranking

Per candidate contract, output rank + score + strike + call/put + entry range + invalidation + expected risk + targets.

**Architect designs** the formula. **Claude implements** the ranker.

**DoD:** ranker reproduces architect's worked example within tolerance.

---

## 🆀 Phase Q — JONARAI Score

Composite 0–100 from all component scores. **Not a probability.**

**DoD:** deterministic; `reasoning[]` lists every component score used.

---

## 🆁 Phase R — NO TRADE Engine

Even with directional bias, the engine must veto when gates fail (spread bad, liquidity insufficient, flow conflict, gamma unfavorable, etc.).

**DoD:** veto conditions match Master Spec §16 exactly.

---

## 🆂 Phase S — Entry Engine

State machine: `SCAN → WATCH → ARMED → CONFIRMED → ENTRY`. Outputs contract, entry range, invalidation, SL, TP1/TP2/TP3.

**DoD:** engine never emits `ENTRY` without going through prior states.

---

## 🆃 Phase T — Trade Management

Dynamic Stop, Trailing Stop, Partial Exit, Time Exit, Theta Protection, Time-to-Prove.

**DoD:** state transitions match Master Spec §11–§14.

---

## 🆄 Phase U — Risk Engine

Pre-entry checks: Spread, Liquidity, Theta, IV, Expected Move, R/R, Slippage, Time, Maximum Loss → outputs `TRADE QUALITY = A / B / C / NO TRADE`.

**DoD:** every check is deterministic; a fixture set proves each grade boundary.

---

## 🆅 Phase V — Alerts

Alerts: `WATCH`, `CONFIRMED`, `ENTRY`, `TP1`, `STOP MOVED`, `TP2`, `TP3`, `EXIT`, `NO TRADE`.

**DoD:** alerts are triggered from real engine outputs only; no synthetic fabrication.

---

## 🆆 Phase W — Track Record

Persist every trade: Time, SPX, Contract, Score, Regime, Flow, GEX, Entry, SL, TP, Exit, P&L, MAE, MFE, Duration.

**DoD:** trade rows are immutable once written; queries by score bucket work.

---

## 🆇 Phase X — Backtesting

**Claude implements** the backtesting engine.
**Architect reviews** methodology: No Look-Ahead, Out-of-Sample, Walk Forward, Slippage, Bid/Ask, Commissions, 0DTE handling, per-regime segmentation. **No curve-fitting.**

**DoD:** the same input produces the same backtest twice; walk-forward wired.

---

## 🆈 Phase Y — Paper Trading

Live signals, no real money. **30–60 day** observation window minimum.

Metrics: Accuracy, Expectancy, Drawdown, Profit Factor, MAE, MFE, False Signals, Stop-Hunt Rate, Time Exit Rate.

**DoD:** empirical calibration of each score bucket (80–84 / 85–89 / 90–92 / 93–95 / 96–97 / 98–100) is documented. Only then is the score's meaning known.

---

## 🆉 Phase Z — SaaS + IBKR

Frontend: Next.js + TypeScript + Tailwind, iPad-first dashboard.

IBKR integration is **optional** and gated by:
- 🛑 Kill Switch
- 🛡️ Risk Limits
- 💰 Position Limits
- ⏰ Time Limits

**DoD (pre-launch):** live IBKR is disabled by default; only turnkey-enabled after paper-trading calibration passes.

---

## 📌 Priority-order overlay (from Master Spec §23)

- **P0** — Time Intelligence, Data Integrity, Entry Confirmation, Risk/Invalidation, Exit Intelligence.
- **P1** — Contract Ranking, MTF, Flow, Gamma, Liquidity, CVD/VWAP, Profit Protection.
- **P2** — UI, Alerts, Reporting.

Trading intelligence must be validated **before** visual complexity is added.

---

_End of BUILD ROADMAP. Phase order is frozen; only DoD content per phase may be
refined as the architect delivers more detail._
