# JONARAI — BLOCKED ON ARCHITECT

> This file is the **explicit list of decisions Claude cannot make**.
> Every item here blocks a downstream phase from starting. The architect
> (ChatGPT) fills them; Claude does not invent them.
>
> Update this file whenever a new blocker is discovered, and remove items
> as the architect resolves them.

---

## 🔴 P0 — Blocks Phase B (Data Master)

- [ ] **Data field enumeration.** For every field the engines will consume
      (SPX ticks, SPX bars, options chain, Greeks per contract, flow prints,
      GEX/DEX/VEX/CHEX, IV surface, VWAP components, CVD sources, volume
      profile inputs, MTF bars per timeframe, ...), the architect must
      provide:
    - Canonical JONARAI field name
    - Source (which provider, which endpoint / websocket topic)
    - Live or historical (or both)
    - Update cadence
    - Licensing: may we display it to end-users? may we store it? may we
      derive further data from it and redistribute the derivative?

- [ ] **Provider matrix.** For each data class above:
    - Primary provider
    - Backup provider (or explicit "none")
    - License / subscription cost tier
    - Whether the account is already owned by the user

## 🔴 P0 — Blocks Phase C (Data Providers)

- [ ] **Adapter contracts per provider.** For each chosen provider, the
      architect confirms the shape of the response we normalize *from*
      (this determines the adapter code Claude writes). Providers will not
      be signed up until the architect confirms licensing rights first.

## 🔴 P0 — Blocks Phase F (SPX Engine) and beyond

- [ ] **Formulas.** For every derived value in the spec, the architect
      confirms the exact formula or references the industry-standard one:
    - VWAP: session-anchored? cumulative? tick or bar based?
    - CVD: uptick/downtick classification rule?
    - Volume Profile: bin size in points? POC calculation?
    - HVN/LVN thresholds?
    - GEX: sign convention (net dealer position)?
    - Gamma Flip: crossing method?
    - Call Wall / Put Wall: max OI or max gamma?
    - IV Rank vs IV Percentile: lookback window?
    - Expected Move: ATM straddle / std-dev-of-return / options-implied?

## 🔴 P0 — Blocks Phase K (MTF Engine)

- [ ] **MTF alignment rules.** How exactly are Weekly / Daily / 1H / 15M
      / 5M combined into `MTF_ALIGNMENT` (0–100)? Weight per timeframe?
      Boolean gate on higher timeframes? Conflict penalty?

- [ ] **Trend/structure definitions** per timeframe. What counts as
      "trending", "range", "breakout", "pullback"?

## 🔴 P0 — Blocks Phase Q (JONARAI Score)

- [ ] **Score weights.** The Time/Entry Spec §4 lists the *components*
      (MTF, Structure, Time, Flow, Gamma, CVD, VWAP, Liquidity, Momentum,
      Volatility, Contract-liquidity, Spread, R/R, Theta, Reversal), but
      not the per-component weight. Architect must supply.
- [ ] **Component sub-scoring formulas.** How does raw `MTF_ALIGNMENT`
      (say 0.72) map to a 0–100 score for the composite? Linear?
      Piecewise?
- [ ] **Reasoning-string vocabulary.** What phrases does `reasoning[]`
      draw from? (Consistency across engines matters for UI.)

## 🔴 P0 — Blocks Phase R (NO TRADE Engine)

- [ ] **Veto thresholds.** Spec §16 enumerates veto *categories* but not
      numeric thresholds:
    - "Bad spread" — spread-percentage cutoff?
    - "Insufficient liquidity" — min bid size / min OI / min volume?
    - "Extreme theta risk" — theta-per-minute cutoff at 0DTE?
    - "Excessive volatility" — IV-percentile cutoff?
    - "Late entry" — minutes-to-close cutoff?

## 🔴 P0 — Blocks Phase S (Entry Engine)

- [ ] **Time-to-Prove windows.** Spec §3 says "the engine must learn/test"
      the window. For the initial hardcoded default before calibration,
      what is the architect's opening value? Per session regime?

## 🔴 P0 — Blocks Phase T (Trade Management)

- [ ] **Profit-lock trigger points.** The state machine
      `PROFIT_DETECTED → STOP_REDUCED → BREAKEVEN_ELIGIBLE → PROFIT_LOCK
      → TRAIL → EXIT` needs trigger conditions per transition.
- [ ] **Trailing-stop distance formula.** ATR-based? Structure-based?
      Fixed percentage of premium?

## 🔴 P0 — Blocks Phase U (Risk Engine)

- [ ] **Trade-quality grade boundaries.** What defines an A / B / C /
      NO-TRADE trade, in numeric terms?

## 🔴 P0 — Blocks Phase X (Backtesting)

- [ ] **Slippage model.** Fixed cents? Fraction of spread? Impact-based?
- [ ] **Commission model.** Per-contract fee schedule to assume?
- [ ] **Fill assumption.** Mid-fill? Aggressor-side fill? Adverse-fill for
      backtest realism?

## 🔴 P0 — Blocks Phase Y (Paper Trading)

- [ ] **Observation window.** 30 days? 60 days? Specific market conditions
      required?
- [ ] **Success criteria per score bucket.** What expectancy would justify
      graduating to live?

## 🔴 P0 — Blocks Phase Z (Live / IBKR)

- [ ] **Kill-switch triggers.** What events auto-disable live trading?
- [ ] **Position limits.** Per contract, per session, per day?
- [ ] **Time limits.** Latest entry time? Auto-flatten by close?

---

## 🟡 Non-blocking (but useful to have early)

- [ ] **Brand palette.** UI colors, logo direction (Claude will use
      neutral placeholders per `dataviz` skill defaults until then).
- [ ] **Domain name.** For deployment (Phase Z).
- [ ] **Analytics platform.** Product analytics / error tracking choice.
- [ ] **Support channel.** How end-users report issues.

---

## 🟢 Resolved (moved out of the blocker list)

_(none yet)_

---

## How to hand a resolution to Claude

Paste the architect's resolution here, in the following shape:

```markdown
### Resolves: [item title]

**Architect (ChatGPT):**
[paste the exact answer]

**Effective phase(s):** [which phase this unblocks]
**Files to update:** [Claude fills this on receipt]
```

Claude will then move the item to the "Resolved" section and update the
corresponding scaffold file(s) — without inventing anything the architect
did not explicitly write.
