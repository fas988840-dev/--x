# Funding — Action Plan (start now, fastest first)

The order below is by **speed to a decision / cash**, not by amount. Every
link and requirement here was verified via web search (Sept 2026). Amounts
are ceilings or ranges, not promises. **Awarded to date: $0** — two
applications are submitted and awaiting review (see "Waiting").

Currency note: "USDC" is a cash-equivalent stablecoin. "PYTH" is a token
whose USD value moves with the market — not fixed cash.

---

## ⚡ Phase 1 — Submit today (ready, no build needed)

### 1. Superteam Instagrants — fastest (USDC, ~48h)
- **Apply:** https://earn.superteam.fun/grants/
- **Amount:** up to **$10,000 USDC**, equity-free
- **Copy from:** `GRANTS/instagrants-submission-fields.md`
- **Steps:**
  1. ⚠️ **Check eligibility first.** The program describes emerging markets
     (India, SE Asia, Eastern Europe, Africa); Saudi Arabia is not named.
     Ask the relevant Superteam chapter before spending time on it — a
     geography rejection costs nothing to avoid, a lot to discover late.
  2. Category: **Code**.
  3. Copy the fields; set a **realistic budget** (don't request $10k just
     because it's the ceiling — over-asking gets rejected).
  4. Submit → decision in ~48 hours.

### 2. ChainGPT Web3 AI Grant — ready (rolling, days)
- **Apply:** https://www.chaingpt.org/web3-ai-grant
- **Amount:** Builder tier ~**$5,000 USDC + $10,000 API credits** (confirm the
  exact ceiling on the page; program goes up to $50k)
- **Copy from:** `GRANTS/chaingpt-submission-fields.md`
- **Steps:** pick **Builder** tier · read the ceiling off the page · copy the
  fields (FactLedger already integrates ChainGPT via `ExplanationAgent`, so it
  qualifies) · submit.

---

## 🟡 Phase 2 — Start now, runs over weeks

### 3. Colosseum Eternal — 4-week sprint
- **Apply / start:** https://colosseum.com/eternal
- **Target:** ~**$250,000** pre-seed + accelerator admission (this is
  investment, not a grant — expect equity/token terms)
- **Materials:** `GRANTS/colosseum-video-scripts.md`,
  `GRANTS/colosseum-submission-fields.md`
- **Steps:** start a four-week self-paced sprint from the Eternal dashboard ·
  post a weekly video update · submit at the end of week 4. The sprint itself
  closes the "no users / no traction" gap that blocks the later tiers.

---

## 🔧 Phase 3 — Build first, then submit

### 4. Pyth — after building the integration (~2 weeks in an npm env)
- **Apply:** developer bounties via https://earn.superteam.fun/ (search Pyth);
  ecosystem program: https://www.pyth.network/blog/pyth-ecosystem-grants-program
- **Amount:** developer bounty **$1–$5,000 USDC**, ~48h decision (small but
  cash); the 50M-token ecosystem pool pays in **PYTH**, not cash
- **Why it's worth it (three returns from one build):** replaces the
  unverifiable CoinGecko price with an on-chain, slot-stamped Pyth price →
  (1) fixes a real product gap (prices stop returning `null` so often),
  (2) removes the inconsistency at the center of the pitch, (3) is itself the
  proof-of-work for the Pyth grant.
- **Plan:** see `PYTH_INTEGRATION_PLAN.md` (build in an environment where
  `npm install` works, against the real `@pythnetwork/client`, with tests —
  never hand-write account layouts or feed IDs).

---

## ⏳ Waiting (already submitted — nothing to do)

- **Solana Foundation** — $25,000, confirmed received, response within ~1 month.
- **Webacy / DD.xyz** (via Superteam Earn) — submitted, no stated timeline.

## 🔴 Later (need users / traction first)

- **Outlier Ventures (Base Camp)** — https://outlierventures.io/apply/ · 12-week
  accelerator · "no users is OK, but no plan for the first user is not."
- **Alliance DAO** — https://alliance.xyz · 9-week program, takes $500k equity,
  accepts ~top 1%.
- **Multicoin Capital / RockawayX** (VCs) — no application form; warm intro
  only; need real query volume and a full-time team. Far off.

---

## The move, in order

```
today:      1) confirm Superteam eligibility → submit   (48h, USDC)
today:      2) submit ChainGPT                           (days)
this week:  3) start the Colosseum sprint
~2 weeks:   4) build Pyth integration → submit bounty
waiting:    Solana Foundation (submitted)
```

**Top priority now:** Superteam Instagrants + ChainGPT — both USDC, both ready,
no build. Start with the Superteam eligibility check, since it's the fastest
path to real money ($10k / 48h).
