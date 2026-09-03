# FactLedger — Demo Guide (Stage 10)

**One line:** FactLedger turns raw Solana on-chain data into a wallet
intelligence score, a risk assessment, and an evidence trail — and it never
guesses. Every number is either read from the chain or explicitly marked
`unknown`.

This guide is a self-contained script for a live demo or a 2–3 minute demo
video. It has two runnable paths: a **local** path that works right now with
no external accounts, and a **live** path that works once the two deployment
secrets are set.

---

## 1. The pitch (≈30 seconds)

> Most "wallet analytics" tools present confident-looking numbers you cannot
> check. When they don't know a token's price, a swap's amount, or whether an
> instruction really was a swap, they guess — and the guess looks identical to
> a fact.
>
> FactLedger is built on one rule: **never fabricate blockchain data.** If a
> value is unknown, the API returns `null` or an explicit `unknown` status
> instead of a plausible number. Scores are deterministic and come with a
> written list of the factors that produced them. It's read-only — no private
> keys, no signing, no withdrawals — so it's safe to point at any wallet.

The differentiator is **trust**: an intelligence layer whose output a reviewer
can audit line by line.

---

## 2. What makes it different (the things to actually show)

These are the "money shots" — each one is a concrete, on-screen proof of the
honesty rule, and each maps to real code in this repo:

| Proof | Where to see it | Why it matters |
|---|---|---|
| `confirmed` vs `candidate` vs `unknown` instruction status | `/evidence` endpoint | The API admits when it only *suspects* a swap instead of pretending it decoded it |
| Prices return `null`, never a guess | any endpoint touching price | An unlisted token or a rate-limited lookup yields `null`, not an approximation |
| Deterministic scores | run any score twice → identical | `src/services/determinism.test.ts` asserts this in CI on every push |
| Explainable scores | `factors` / `reasoning` arrays | Every score ships with the named factors that produced it — no opaque ML |
| Deterministic AI fallback | `summarySource: "deterministic"` | With no ChainGPT key, `/explanation` still answers from real facts, never silence or a hallucination |
| Security enforced | `401` on protected routes | `API_KEYS` is set on the live server; unauthenticated calls are refused |

---

## 3. Demo setup

### Path A — Local (works now, no secrets needed)

```bash
npm install
npm run dev            # starts on http://localhost:3000
```

Set `SOLANA_RPC_URL` to a mainnet endpoint (a dedicated provider like Helius
is recommended for the live-alerts stream; the public endpoint works for the
rest). Leave `API_KEYS` unset locally so every route is open during the demo.

### Path B — Live (once the two secrets are added)

- **API (Render):** `https://factledger-api.onrender.com`
  — already live; `/api/v1/health` returns `200`.
- **Dashboard (Vercel):** deploys automatically once `VERCEL_TOKEN` is set.

> Pending secrets (added by the repo owner in the browser, at
> Settings → Secrets → Actions):
> - `VERCEL_TOKEN` — enables the dashboard deploy.
> - `FACTLEDGER_API_KEY` — lets the automated live-verify smoke tests call the
>   secured endpoints. For a manual demo against the live API, send the same
>   key yourself as an `X-API-Key` header (see below).

Demo wallet used throughout: `11111111111111111111111111111112`
(the Solana System Program — a real, always-present, read-only address).

---

## 4. The walkthrough (≈3 minutes)

Run these in order. On the live API, add `-H "X-API-Key: <your-key>"` to every
call except `/health`. Replace `$API` with `http://localhost:3000` or
`https://factledger-api.onrender.com`.

**1) It's alive and honest about its dependencies.**
```bash
curl $API/api/v1/health
# → {"status":"ok","service":"FactLedger","version":"0.1.0",
#    "dependencies":{"priceProvider":"ok"}}
```
Note `dependencies` reports a degraded price provider as a *field*, not by
failing the health check — a liveness probe must not depend on a third party.

**2) The intelligence score — with its reasoning.**
```bash
curl $API/api/v1/wallet/11111111111111111111111111111112/intelligence
```
Show `data.score` (0–100) and its four equally-weighted components
(activity / sophistication / consistency / efficiency), then the `factors`
array that explains the number. Call the endpoint twice — the score is
**identical** both times.

**3) The risk assessment — also explained.**
```bash
curl $API/api/v1/wallet/11111111111111111111111111111112/risk
```
Show `data.level` (low/medium/high), `data.score`, the `reasoning` array, and
the `disclaimer` field (every scored endpoint carries "not financial advice").

**4) The evidence trail — the honesty centerpiece.**
```bash
curl $API/api/v1/wallet/11111111111111111111111111111112/evidence
```
Walk the `evidence` entries: each cites a real transaction signature, slot,
program, and a `status` of `confirmed` / `candidate` / `unknown` with a fixed
`confidencePercent` (100 / 50 / 0). This is where FactLedger visibly refuses
to overstate what it knows.

**5) Plain-language explanation — with its source tagged.**
```bash
curl $API/api/v1/wallet/11111111111111111111111111111112/explanation
```
Show `data.summary` and `data.summarySource`. With no ChainGPT key it reads
`"deterministic"` — the summary was built from the same real facts, never
guessed. `keyActivities` / `riskAssessment` / `patterns` always come straight
from the pipeline regardless of the LLM.

**6) It refuses bad input cleanly.**
```bash
curl -i $API/api/v1/wallet/not-a-wallet/intelligence
# → HTTP 400  {"error":{"code":"VALIDATION_ERROR", ...}}
```

**7) The supported protocols are verified, not aspirational.**
```bash
curl $API/api/v1/protocols
```
Only adapters with program IDs verified against each project's own docs are
registered (Raydium, Jupiter) — and they report swaps as `candidate`, never
inventing amounts.

**8) (Dashboard)** Open the Vercel URL, paste the demo wallet, and show the
same data rendered as cards — Observable Data, Intelligence, Risk, Evidence
table, Research, and the AI Explanation with its `ChainGPT` / `deterministic`
badge. The dashboard is a thin read-only client; it calls the API server-side
only, so no key ever reaches the browser.

---

## 5. Suggested video narration (2–3 min)

1. **(0:00) Hook.** "Every wallet-intelligence tool shows you numbers. FactLedger shows you numbers you can check."
2. **(0:20) Problem.** Show a generic tool's confident output; ask "which of these is real and which is a guess? You can't tell."
3. **(0:40) Rule.** State the invariant: never fabricate — unknown means `null` or `unknown`, on screen.
4. **(1:00) Score.** Run `/intelligence`; highlight the `factors` reasoning; run it twice to show determinism.
5. **(1:40) Evidence.** Run `/evidence`; point at a `candidate` row — "it suspects a swap, and says so, instead of faking the amount."
6. **(2:10) Safety.** Note read-only: no keys, no signing; and the `401` on secured routes.
7. **(2:30) Close.** "An intelligence layer a reviewer can audit line by line. That's FactLedger."

---

## 6. Architecture in one breath

A linear, read-only pipeline of single-purpose services:

```
SolanaRpcClient → TransactionRetriever → InstructionParser (DexRegistry)
  → TokenBalanceDeltaCalculator / PriceProvider
    → BehaviorAnalyzer → IntelligenceScorer + RiskAssessor
      → Express API (hardened: Helmet, CORS allowlist, rate limits, API keys)
```

Scores are deterministic weighted combinations of named factors; unknown
values propagate as `null`/`unknown` end to end; amounts are kept as strings
to preserve on-chain precision. See `CLAUDE.md` for the full design invariants.

---

## 7. Judge FAQ

- **"Is it live?"** The API is deployed on Render (`/health` → 200) and
  externally verified via the `Live Verification` GitHub Actions workflow.
- **"Does it hold funds or keys?"** No. It only calls read methods on the
  Solana RPC; it never requests a private key, seed phrase, or signature.
- **"Can I trust the scores?"** They're deterministic (CI asserts identical
  output for identical input) and every score is accompanied by the factors
  that produced it.
- **"What about the AI part?"** The one LLM integration only rephrases facts
  already computed by the pipeline, and falls back to a deterministic sentence
  when it's unavailable — it is never a source of a new fact.

---

## 8. Links

- API health: `https://factledger-api.onrender.com/api/v1/health`
- Repo: `https://github.com/fas988840-dev/PROJECT-x`
- Design invariants: [`CLAUDE.md`](CLAUDE.md)
- Deployment: [`DEPLOYMENT.md`](DEPLOYMENT.md)
