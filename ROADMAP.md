# FactLedger — Master Roadmap (A → Exit)

The single ordered path to make the project stronger and, eventually,
sellable at a high price. Read top to bottom — each phase unlocks the next.

**Honest rule (the project's own):** a high sale price is built, not claimed.
It comes from **users → revenue → growth**, in that order. The code alone is
open-source (MIT) and cannot be sold on its own. Every number below is a
target, not a promise; awarded/earned to date is **$0**.

---

## A. Activate — finish the deployment (week 1–2)
**Goal:** one complete, live product people can actually use.
- Add GitHub secret `VERCEL_TOKEN` → the dashboard deploys to Vercel.
- Add GitHub secret `FACTLEDGER_API_KEY` → the E2E live checks pass.
- Move the API onto a dedicated Solana RPC (Helius free tier) → enables the
  live-alert stream and removes public-endpoint rate limits.
- Confirm you control a Solana wallet (Phantom/Solflare, seed phrase saved) to
  receive any grant USDC.

**Metric:** API + dashboard both live and verified.
**Value:** baseline — a finished product, not a prototype.

---

## B. Deepen — make the product defensible (week 2–4)
**Goal:** depth a competitor can't copy in a weekend.
- **Integrate Pyth** (on-chain, verifiable prices) — closes the CoinGecko gap,
  removes the pitch's one inconsistency, and qualifies for a Pyth grant. Build
  where `npm install` works, against the real `@pythnetwork/client`, with
  tests (see `PYTH_INTEGRATION_PLAN.md`). Never hand-write account layouts.
- Verify Orca + Magic Eden program IDs and account layouts → move those
  adapters from CANDIDATE to VERIFIED with real amount extraction.
- Exercise the live-alert WebSocket against a real RPC subscription.

**Metric:** verified swap amounts, working live alerts, fewer `null`s.
**Value:** a serious product with real technical moat.

---

## C. Get users — the gate everything waits on (week 3–8)
**Goal:** first 50–200 real users / API consumers.
- Public launch: post on X, Solana communities, Superteam.
- Push the **MCP server** to AI-agent builders (already built — market it).
- Content: "how to check a Solana wallet without guessing", worked examples.

**Metric:** 50–200 active users · daily API requests.
**Value:** tens of thousands — users are the first real multiplier.

---

## D. Monetize — the biggest multiplier (month 2–4)
**Goal:** first recurring revenue.
- Paid tiers: API keys with usage limits (free / pro / enterprise), riding the
  existing `API_KEYS` gate.
- Or per-call micropayments — built properly (verify the transaction, amount,
  recipient; reject reuse), never the stub that accepts anything.

**Metric:** first $500–$5,000 / month MRR.
**Value:** six figures — revenue lifts valuation 3–6×.

---

## E. Scale + raise — prove growth (month 3–6)
**Goal:** demonstrate a growth curve.
- **Colosseum Eternal sprint → $250k pre-seed + accelerator admission.**
- Then Outlier Ventures / Alliance DAO accelerators.
- Grow MRR month over month; keep the evidence trail public.

**Metric:** MRR growing at a clear rate.
**Value:** $1M–$5M investment valuation (equity, not a sale).

---

## F. Exit — sell at a high price (month 6–18+)
**Goal:** a profitable exit.
- With real ARR + users + growth, approach acquirers: **Webacy, Helius,
  Chainalysis, TRM Labs, Solscan/Dune/Flipside**, or AI-agent infra buyers.
- Price = a multiple of ARR (roughly 3–10× annual recurring revenue).

**Value:** set by ARR — e.g. $100k ARR with good growth → ~$300k–$1M+.

---

## The value ladder (honest)
```
now — code only            ~$0–5k
+ complete product (A+B)   ~$10k
+ 200 users (C)            tens of thousands
+ recurring revenue (D)    six figures   ← the turning point
+ growth + Colosseum (E)   $1M–$5M valuation
+ ARR to sell (F)          multiple of ARR = the high price
```

## In one line
Finish it (A+B) → get users (C) → earn revenue (D) → grow & raise (E) →
sell on ARR (F). There is no shortcut to a high price; every month of real
traction is worth thousands on the final number.

---

## The proprietary-layer strategy — what actually unlocks a high price

The single biggest limit on the sale price is that the core is **open-source
(MIT): anyone can fork it for free.** You cannot sell what a buyer can copy in
an afternoon. A genuinely large exit needs value a buyer *cannot* replicate —
so build a **proprietary layer on top of the open core**, and keep the open
core as the credibility/trust engine (it's the honesty thesis, so keep it
open). What you actually sell is the layer, not the code.

**Four proprietary layers, in order of leverage:**

1. **Hosted service (SaaS).** The open code runs on your infrastructure with
   uptime, a dedicated RPC, rate limits, keys, and support. Buyers pay for the
   running business and its customers, not the source. This is the fastest
   layer to stand up (it's Phase A + D above).
2. **Accumulated proprietary data.** Every wallet/token you score can be cached
   and enriched over time into a dataset that grows with usage and **cannot be
   regenerated by a fork on day one**. A labeled history of risk findings is a
   real moat — the longer it runs, the more valuable and less copyable.
3. **Distribution & relationships.** Paying customers, integration partners,
   the brand, the domain, an audience. A fork starts at zero users; you don't.
4. **Optional dual-licensing.** Keep the core MIT, but offer a **commercial
   license** for closed/enterprise use of premium modules. Lets enterprises pay
   while the open thesis stays intact. (Design new premium modules for this from
   the start; do not relicense what's already MIT.)

**Where each maps in the roadmap:**
```
Layer 1 (hosted service)     → Phase A + D  (deploy + paid tiers)
Layer 2 (proprietary data)   → Phase C + D  (accrues as users hit the API)
Layer 3 (distribution)       → Phase C + E  (users, partners, brand)
Layer 4 (dual-license)       → Phase D      (premium modules only)
```

## Max-value sale playbook (Phase F)
1. Sell the **layer + business** (hosted service, data, customers, brand) — the
   MIT core is the trust story, never the line item.
2. Sell **at the peak of the growth curve**, not after it flattens — the
   multiple tracks growth rate, not just revenue.
3. Run a **competitive process**: bring 3+ strategic buyers to the table at
   once (Webacy, Helius, Chainalysis, TRM, a Solana data provider). One buyer
   sets a low price; competition sets a high one.
4. Frame the **strategic premium**: show exactly which gap in the buyer's own
   product your data/users fill, so they pay above the pure ARR multiple.
5. Keep the **founder-retention** option open — an acqui-hire premium is real
   when the expertise is scarce.

**Honest ceiling:** even executed perfectly, the number tracks real ARR, growth
and moat. The proprietary layer is what moves the exit from "modest" to the
$5M–$20M range in the value ladder — it is not a substitute for the traction
that has to come first.

---

## Funding already in flight (as of 2026-09-04)
Solana Foundation ($25k), Webacy/DD.xyz, ChainGPT ($5k + credits), and a
Superteam submission — all submitted, none decided, **$0 awarded**. See
`GRANTS/STATUS-2026-09-04.md` and `GRANTS/action-plan-now.md`.
