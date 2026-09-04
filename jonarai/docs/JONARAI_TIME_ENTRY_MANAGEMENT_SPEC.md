# JONARAI — TIME, ENTRY & TRADE MANAGEMENT CORE SPEC

> **Status:** BINDING — this document is a subsection of `JONARAI_MASTER_SPEC.md`.
> **Authority:** ChatGPT (Product/Trading Intelligence Architect).
> **Rule for Claude:** Do NOT deviate from this spec. Do NOT collapse the
> Score→Gates→Time→Contract→Entry pipeline into `if score >= 93: BUY`.
> Any proposed change is a suggestion that requires ChatGPT approval before code.

---

## 1. PRIMARY OBJECTIVE

JONARAI is not designed merely to predict SPX direction.

Its primary objective is to determine:

1. WHEN to trade.
2. WHETHER to trade.
3. WHICH SPX/SPXW 0DTE contract provides the best executable setup.
4. WHERE to enter.
5. WHERE the trade thesis becomes invalid.
6. WHERE to take profits.
7. WHEN to move the stop.
8. WHEN to trail the stop.
9. WHEN momentum is deteriorating.
10. WHEN to exit before expected adverse continuation when evidence supports doing so.

**The system must prefer NO TRADE over a low-quality trade.**

---

## 2. TIME INTELLIGENCE ENGINE — HIGHEST PRIORITY (P0)

Time is a first-class signal. Because JONARAI targets 0DTE, the same directional
signal at 10:00 AM is not equivalent to the same signal near close due to
changing theta, gamma, liquidity, and contract behavior.

The engine must model:

- Time of day
- Minutes from market open
- Minutes to market close
- Minutes to option expiration
- Opening volatility
- Lunch-session behavior
- Power Hour
- Closing volatility
- Theta acceleration
- Intraday IV behavior
- Gamma sensitivity
- Expected move consumed
- Remaining expected move
- Time since breakout
- Time since confirmation
- Time spent above/below VWAP
- Time spent at liquidity levels
- Time since flow confirmation
- Time since momentum confirmation

### Session Regimes

Classify current time into configurable regimes such as:

```
PREMARKET
OPENING_AUCTION
OPENING_EXPANSION
MORNING_TREND
MIDDAY
AFTERNOON_EXPANSION
POWER_HOUR
CLOSING_RISK
```

No entry is allowed solely because price reached a level.

**Price + Time + Structure + Flow + Options + Gamma + Liquidity must confirm the opportunity.**

---

## 3. TIME-TO-PROVE ENGINE

Every entry must have a Time-to-Prove window.

```
ENTRY
  ↓
Expected immediate behavior
  ↓
Momentum confirmation within N seconds/minutes
  ↓
If confirmation fails:
  REDUCE / EXIT / INVALIDATE
```

The engine must learn/test how long successful setups normally require before
moving favorably.

Track:

- Entry timestamp
- Time to first favorable move
- Time to TP1
- Time to MFE
- Time spent underwater
- Time to invalidation
- Time to momentum failure

A trade that does not behave as expected within its statistical time window
may be exited even before the hard stop.

---

## 4. JONARAI ENTRY QUALITY SCORE

Every candidate receives a score from **0–100**.

> **This score MUST NOT be presented as guaranteed win probability.**

Initial components:

```
MTF_ALIGNMENT
MARKET_STRUCTURE
TIME_QUALITY
OPTIONS_FLOW
GAMMA_STRUCTURE
CVD
VWAP
LIQUIDITY
MOMENTUM
VOLATILITY
CONTRACT_LIQUIDITY
SPREAD_QUALITY
RISK_REWARD
THETA_RISK
REVERSAL_RISK
```

Weights must be configurable and later calibrated through historical and
paper-trading data.

### Target operating policy

```
 0–79   = NO TRADE
80–87   = WATCH
88–92   = HIGH QUALITY WATCH
93–100  = ELITE SETUP
```

**IMPORTANT:** `93–100` means JONARAI SCORE, **not** `93–100% guaranteed
probability of profit`. Before production, score calibration must determine
the empirical win rate, expectancy, drawdown, and failure characteristics of
each score bucket.

---

## 5. ELITE ENTRY GATE

A score `>= 93` alone must **NOT** trigger an entry.

An ELITE ENTRY requires **mandatory gates**:

```
Score >= configured threshold
AND MTF aligned
AND Flow confirms
AND Gamma environment acceptable
AND Liquidity confirms
AND CVD confirms
AND VWAP structure confirms
AND Momentum confirms
AND Spread acceptable
AND Contract liquidity acceptable
AND Risk/reward acceptable
AND No reversal warning
AND No time-risk veto
```

Only then: `ENTRY_CONFIRMED = TRUE`. Otherwise: `NO TRADE`.

---

## 6. CONTRACT SELECTION ENGINE

After directional confirmation, scan eligible SPXW 0DTE contracts.

For every contract calculate:

Bid, Ask, Mid, Spread, Spread %, Volume, Open Interest,
Delta, Gamma, Theta, Vega, IV, Intrinsic value, Extrinsic value,
Distance from spot, Expected premium sensitivity, Liquidity quality,
Slippage estimate, Theta risk, Gamma opportunity.

**Output:**

```
CONTRACT_RANK
CONTRACT_SCORE
STRIKE
CALL/PUT
ENTRY_RANGE
INVALIDATION
EXPECTED_RISK
TARGETS
```

Selection is based on execution quality and expected risk-adjusted behavior —
**not** simply the cheapest premium.

---

## 7. ENTRY STATE MACHINE

Every potential trade passes through:

```
SCAN → WATCH → ARMED → CONFIRMED → ENTRY → MANAGE → EXIT
```

**The system must never jump directly from SCAN to ENTRY.**

---

## 8. TARGET ENGINE

Every trade must have dynamic targets: `TP1`, `TP2`, `TP3`, `RUNNER`.

Targets may use: SPX structure, Liquidity levels, VWAP bands, HVN/LVN, POC,
Gamma levels, Call Wall, Put Wall, Expected Move, ATR, Momentum, Contract
premium behavior.

**Targets must adapt as market conditions change.**

---

## 9. INITIAL STOP ENGINE

Stop placement must not be arbitrary. Use:

Thesis invalidation, Market structure, SPX level, ATR, Volatility, Gamma,
Liquidity, Option premium behavior, Bid/ask conditions.

**Separate:**

```
SPX_INVALIDATION_LEVEL
   from
OPTION_EXECUTION_STOP
```

This prevents normal option-premium noise from automatically invalidating a
valid SPX thesis.

---

## 10. STOP-HUNT / NOISE PROTECTION

Before stopping a trade, determine whether the move is:

```
NORMAL_NOISE
PULLBACK
LIQUIDITY_SWEEP
POSSIBLE_STOP_HUNT
REAL_REVERSAL
```

Inputs: Price structure, CVD, VWAP, Volume, Flow, Gamma, Liquidity, ATR, IV,
Premium behavior, MTF structure.

**Do NOT widen risk indefinitely.** If the original thesis is invalidated, exit.

---

## 11. PROFIT-LOCK ENGINE

After favorable movement, protect realized opportunity progressively.

```
ENTRY
  ↓
INITIAL_RISK
  ↓
PROFIT_DETECTED
  ↓
STOP_REDUCED
  ↓
BREAKEVEN_ELIGIBLE
  ↓
PROFIT_LOCK
  ↓
TRAIL
  ↓
EXIT
```

Stop movement must depend on market evidence rather than a single fixed percentage.

---

## 12. DYNAMIC TRAILING STOP

Trailing logic may use: SPX structure, VWAP, Micro swing lows/highs, ATR,
Contract premium, Delta, Gamma, CVD, Flow, Momentum, Liquidity.

- **For CALL:** Trail under confirmed bullish structure.
- **For PUT:** Trail above confirmed bearish structure.

**Never move the stop backward to increase risk** after profit protection has
activated, unless an explicitly tested strategy permits it.

---

## 13. EARLY EXIT ENGINE — CRITICAL

JONARAI must continuously calculate `EXIT_RISK_SCORE = 0–100`.

Monitor: Momentum deceleration, CVD divergence, Flow reversal, Delta
deterioration, Gamma change, IV contraction, VWAP failure, Liquidity
rejection, Failed breakout, Volume exhaustion, MTF conflict, Contract premium
weakness, Spread deterioration, Time decay acceleration, Approaching opposing
liquidity/gamma level.

**Possible actions:**

```
HOLD
TIGHTEN_STOP
PARTIAL_EXIT
EXIT_RUNNER
FULL_EXIT
```

The objective is not to claim perfect prediction of the exact top/bottom —
it is to detect **statistically meaningful deterioration** before unnecessary
giveback whenever possible.

---

## 14. PROFIT PROTECTION

Track continuously:

```
ENTRY_PREMIUM
CURRENT_PREMIUM
MAX_PREMIUM
MFE
MAE
OPEN_PNL
MAX_OPEN_PNL
PROFIT_GIVEBACK_PERCENT
```

Example configurable logic:

- If profit expands strongly → activate profit protection.
- If momentum remains strong → allow runner.
- If profit begins deteriorating AND exit-risk signals confirm → tighten stop.
- If reversal evidence becomes strong → partial/full exit.

**Optimize the balance between `EXITING_TOO_EARLY` and `GIVING_BACK_TOO_MUCH_PROFIT`.**

---

## 15. REVERSAL ANTICIPATION ENGINE

Generate `REVERSAL_RISK = 0–100` using combinations of:

Price divergence, CVD divergence, Flow divergence, Gamma structure,
Liquidity rejection, Volume exhaustion, VWAP failure, Failed breakout,
MTF resistance/support, IV behavior, Option premium behavior, Time-of-day
behavior.

Output tiers:

```
LOW_REVERSAL_RISK
MODERATE_REVERSAL_RISK
HIGH_REVERSAL_RISK
CRITICAL_REVERSAL_RISK
```

This engine must influence stop tightening and exits.

---

## 16. NO-TRADE ENGINE

`NO TRADE` has **equal importance** to `ENTRY`.

Veto entry when conditions include: Bad spread, Insufficient liquidity,
Conflicting MTF, Conflicting flow, Unfavorable gamma, Extreme theta risk,
Poor risk/reward, Late entry, Chasing, Excessive volatility, Insufficient
volatility, Unconfirmed breakout, High reversal risk, Missing/stale data,
Provider disagreement, Abnormal market conditions.

---

## 17. DATA INTEGRITY FAILSAFE

No trade may be generated when critical data quality is uncertain.

Check: `DATA_FRESHNESS`, `TIMESTAMP_SYNC`, `MISSING_FIELDS`, `OUTLIERS`,
`WEBSOCKET_STATUS`, `PROVIDER_STATUS`, `QUOTE_AGE`.

- Critical data failure → `ENTRY_DISABLED = TRUE`.
- Existing position → switch to predefined safe-management policy.

---

## 18. LIVE TRADE OUTPUT (example)

```
JONARAI — ELITE SETUP

SPX: 6842.25
Direction: CALL
Contract: SPXW 6845C 0DTE

JONARAI SCORE: 95/100
TIME QUALITY: 97
MTF: 96
FLOW: 94
GAMMA: 93
LIQUIDITY: 96
MOMENTUM: 95

Status: ENTRY CONFIRMED

Entry Premium: dynamic executable range
SPX Invalidation: dynamic
Initial Option Risk: dynamic

TP1: dynamic
TP2: dynamic
TP3: dynamic
Runner: active

Time-to-Prove: dynamic

REVERSAL RISK: 18/100
EXIT RISK: 12/100

Action: HOLD
```

---

## 19. LIVE MANAGEMENT OUTPUT (example)

```
PROFIT PROTECTION ACTIVE

Entry: 8.40
Current: 11.60
Maximum: 12.05

Open return: +38.1%
Maximum return: +43.5%

Momentum: STRONG
Flow: CONFIRMED
CVD: CONFIRMED
Reversal Risk: 24
Exit Risk: 19

Action: TRAIL STOP
Next state: TP2 / RUNNER
```

---

## 20. EXIT OUTPUT (example)

```
EARLY EXIT SIGNAL

Reason:
  CVD divergence
  Flow weakening
  Failed continuation
  Premium momentum deterioration
  Opposing liquidity approaching

Exit Risk: 87/100

Action: PROTECT PROFIT / EXIT
```

The system records the subsequent market path to determine whether the
early-exit decision added or destroyed expectancy.

---

## 21. PERFORMANCE CALIBRATION

Every completed trade must be stored.

Track: Score at entry, Time score, Contract score, Entry time, Exit time,
Entry premium, Exit premium, MFE, MAE, Maximum unrealized profit, Profit
captured, Profit giveback, Exit reason, Stop reason, Time-to-prove, Reversal
score, Exit-risk score.

**Analyze results by score bucket:**

```
80–84
85–89
90–92
93–95
96–97
98–100
```

For each bucket calculate: Sample size, Win rate, Loss rate, Expectancy,
Profit factor, Average winner, Average loser, Maximum drawdown, MAE, MFE,
Profit capture ratio.

**This determines whether 93+ setups actually demonstrate superior performance.**

---

## 22. NON-NEGOTIABLE PRINCIPLE

JONARAI must optimize for:

```
SELECTIVITY + TIMING + EXECUTION QUALITY + RISK CONTROL + PROFIT CAPTURE
```

It must **NOT** optimize for number of signals.

- If there is no sufficiently strong setup → **NO TRADE**.
- Missing a trade is acceptable.
- Taking an unqualified trade is not.

---

## 23. PRIORITY ORDER

Development priority:

```
P0 — Time Intelligence
P0 — Data Integrity
P0 — Entry Confirmation
P0 — Risk / Invalidation
P0 — Exit Intelligence

P1 — Contract Ranking
P1 — MTF
P1 — Flow
P1 — Gamma
P1 — Liquidity
P1 — CVD/VWAP
P1 — Profit Protection

P2 — UI
P2 — Alerts
P2 — Reporting
```

**Trading intelligence must be validated before visual complexity is added.**

---

## 24. DESIGN GUARDRAILS FOR CLAUDE (IMPLEMENTATION AGENT)

These are enforcement rules on the implementer. Violating any of them is a
spec violation, not a stylistic choice.

1. **Never** collapse `score >= 93` into a direct `BUY` decision. The full
   pipeline is:
   ```
   Score → Mandatory Gates → Time Confirmation → Contract Confirmation
        → Entry → Time-to-Prove → Dynamic Profit Lock → Reversal/Exit Monitoring
   ```
2. **Never** present the score as a probability of profit. It is a
   selectivity score; calibration determines its empirical meaning.
3. **Never** hardcode weights that ChatGPT has not signed off on. All
   weights are configurable.
4. **Never** allow entry when critical data is stale, missing, or
   inconsistent — regardless of score.
5. **Never** widen a stop after profit protection activates.
6. **Never** merge `SPX_INVALIDATION_LEVEL` with `OPTION_EXECUTION_STOP` —
   they are separate signals.
7. **Prefer `NO TRADE` over a marginal trade.** The engine's default answer
   is silence.
8. **Every scoring output must carry `reasoning[]`** — a human-readable list
   of the factors that drove the score, matching the FactLedger-style
   explainability requirement.
9. **Deterministic scoring** — the same inputs must always produce the same
   score. No hidden randomness. No LLM-in-the-loop for the score itself.
10. **No live IBKR execution before paper-trading calibration** — see
    Master Spec Phase Y/Z.

---

_End of TIME, ENTRY & TRADE MANAGEMENT CORE SPEC._
