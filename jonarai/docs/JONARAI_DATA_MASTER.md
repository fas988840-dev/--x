# JONARAI — DATA MASTER

> **Status:** ⏳ PLACEHOLDER — awaiting ChatGPT.
>
> This file will define **every** data field JONARAI depends on, its
> source, its licensing, and its runtime characteristics. Until it is
> written by the architect, Claude may **not** invent field names, guess
> provider APIs, or hardcode any data-source URL.

---

## 1. Purpose

The Data Master is the single source of truth for:

- What data JONARAI consumes.
- Where that data comes from (primary + backup provider).
- Whether it is live (websocket), historical (REST), or both.
- Whether the license permits us to display it to end-users, store it, or
  derive further data from it.
- What the canonical field name is inside JONARAI (so every downstream
  engine reads the same key).

---

## 2. Required Sections (to be filled by architect)

### 2.1 SPX / SPXW Underlying Data
- SPX index price (bid/ask/last, tick vs. 1-min bar)
- Session opens, previous close, HOD/LOD
- Historical OHLCV (Weekly / Daily / 1H / 15M / 5M for the MTF engine)
- Volume (if attainable — SPX is an index; consider proxy)

### 2.2 Options Chain (SPX + SPXW)
- Full chain per expiry (strike, right, bid, ask, mid, size, OI)
- Quote timestamp + quote age
- Greeks per contract (Δ, Γ, Θ, ν, ρ) and higher-order (Vanna, Charm, Vomma)
- IV per contract (and IV surface if provider supports)

### 2.3 Options Flow
- Trade-level prints (block, sweep, split, floor)
- Aggressor side inference (buy/sell)
- Premium sums (call/put/net) at configurable buckets
- Volume delta over rolling windows

### 2.4 Gamma / Dealer Positioning
- GEX / DEX / VEX / CHEX (raw or derived — decide per provider)
- Gamma Flip level
- Call Wall / Put Wall
- 0DTE gamma concentration

### 2.5 Volatility
- ATM IV
- IV Rank / Percentile
- Expected Move (session / 0DTE / weekly)
- IV Skew
- Term Structure
- Realized Volatility

### 2.6 Microstructure
- VWAP (session + anchored variants)
- CVD (Cumulative Volume Delta)
- Volume Profile: POC, VAH, VAL, HVN, LVN
- Opening Range
- Previous session HOD/LOD

### 2.7 Data Integrity
- Provider heartbeat / websocket status
- Quote age per feed
- Cross-provider agreement check (if multiple providers)

---

## 3. Provider Matrix (to be filled by architect)

| Data | Primary Provider | Backup | Live? | Historical? | Licensing | Redistribution allowed? |
|------|------------------|--------|-------|-------------|-----------|-------------------------|
| SPX ticks | *TBD* | *TBD* | *TBD* | *TBD* | *TBD* | *TBD* |
| SPX bars | *TBD* | *TBD* | *TBD* | *TBD* | *TBD* | *TBD* |
| Options chain | *TBD* | *TBD* | *TBD* | *TBD* | *TBD* | *TBD* |
| Greeks | *TBD* | *TBD* | *TBD* | *TBD* | *TBD* | *TBD* |
| Options flow | *TBD* | *TBD* | *TBD* | *TBD* | *TBD* | *TBD* |
| GEX / walls | *TBD* | *TBD* | *TBD* | *TBD* | *TBD* | *TBD* |
| IV surface | *TBD* | *TBD* | *TBD* | *TBD* | *TBD* | *TBD* |

**Rule:** No commercial subscription is purchased until the licensing row
for that data is confirmed by the owner.

---

## 4. Canonical Field Names (to be filled)

Every downstream engine reads only from these keys. No engine may invent a
field name or read a provider-specific alias directly.

_(To be enumerated once section 2 is finalized.)_

---

_This file is a placeholder. Claude must not populate it with guessed
data — the architect fills it based on real provider docs and licensing._
