# FactLedger — Technical Proposal
### Solana Foundation Grant · Developer Tools

**Applicant:** Abdullah Al-Anzi (solo developer)
**Contact:** fas988840@gmail.com
**Repository:** https://github.com/fas988840-dev/PROJECT-x
**Live page:** https://claude.ai/code/artifact/d4bd6b65-b871-4e54-a0e6-ae418bc3e4be
**Amount requested:** $25,000 USD

---

## 1. Summary

FactLedger is a read-only Solana wallet intelligence API. It turns raw on-chain
transaction history into behavioural metrics, an intelligence score, and a risk
assessment — and every number it returns can be independently re-derived from the
chain by the person reading it.

Two design rules define it, and both are enforced in code rather than promised in
documentation:

1. **It never fabricates.** Any value the platform cannot verify — a price, a fee, a
   decoded swap amount — is returned as `null` or an explicit `unknown`, never as a
   plausible-looking estimate.
2. **It never overstates confidence.** Every DEX instruction is classified
   `confirmed`, `candidate`, or `unknown` against independently verified program IDs.
   These three states are never collapsed into one to make output look more complete.

## 2. Problem

Wallet analysis on Solana today splits into two unsatisfying categories.

**Heuristic tools** claim to detect DEX activity by pattern-matching program IDs
loosely. Raydium and Jupiter each ship multiple program versions; unverified programs
are routinely mislabelled as swaps. Users act on this data believing it was verified.

**Commercial analytics** return risk and reputation scores from proprietary models.
A user cannot audit the score, cannot reproduce it, and cannot tell which
transactions drove it. When such a score gates access to a protocol or informs a
counterparty decision, that opacity is a real cost.

Neither category tells the user what it does not know. That is the gap FactLedger
addresses.

## 3. Solution and architecture

FactLedger is a linear pipeline of single-purpose services. Each stage may only
consume what the previous stage actually produced.

```
SolanaRpcClient          read-only RPC access; no signing, no key material
  → TransactionRetriever  normalises signatures/transactions (legacy + versioned)
    → InstructionParser   classifies each instruction against DexRegistry
      → DexRegistry       verified program-ID → decoder adapters
    → TokenBalanceDelta   diffs pre/post token balances, amounts kept as strings
    → PriceProvider       CoinGecko; returns null on any failure, never a fallback
      → BehaviorAnalyzer   frequency, failure rate, diversity, timing, volume
        → IntelligenceScorer  4 weighted components, each with named factors
        → RiskAssessor        5 weighted factors, each with written reasoning
```

**Determinism.** `IntelligenceScorer` and `RiskAssessor` are pure weighted
combinations of named factors. Identical input must produce byte-identical output,
and this is verified automatically: `determinism.test.ts` runs each scorer twice on
fixed input and asserts exact equality. It runs on every push. A regression in
determinism fails the build.

**Explainability.** Every score ships with the `factors` and `reasoning` arrays it was
built from. A reviewer can take the transaction signatures we cite, query them via
any public RPC endpoint, and recompute the score by hand.

**Precision.** All on-chain amounts and fees are carried as strings (lamports / raw
token units), never JavaScript numbers. `normalizeAmount()` returns `null` rather
than a lossy value when an amount exceeds safe integer range.

**Read-only by construction.** The RPC client exposes only read methods and a
read-only WebSocket log subscription. The codebase contains no keypair handling, no
signing path, and requests no credentials or seed phrases.

**Interfaces.** A REST API (12 endpoints), an MCP server exposing the same pipeline
as tools to MCP-compatible AI clients, and a read-only Next.js dashboard.

## 4. What is already built

The pipeline described above is implemented and running in CI, not planned.

| Component | State |
|---|---|
| RPC client, transaction retrieval, instruction parsing | Complete |
| Raydium AMM V4 + Jupiter V6 detection (instruction type) | Complete, `candidate` status |
| Behaviour analysis, intelligence scoring, risk assessment | Complete, determinism-tested |
| Evidence engine (per-instruction citation with fixed confidence mapping) | Complete |
| Alert engine (one-shot) and live SSE alert stream | Complete |
| REST API with Helmet, CORS allowlist, rate limiting, API-key auth | Complete |
| MCP server, read-only dashboard, Docker image | Complete |

**Verification, as of 31 August 2026:** CI passes end to end on GitHub's own
runners — dependency audit, ESLint, `tsc --noEmit`, 133 tests (including the
determinism check), and a production build.
Run: https://github.com/fas988840-dev/PROJECT-x/actions/runs/33347156720

## 5. Honest limitations

Stating these is consistent with how the software itself behaves.

- **Swap amounts are not extracted.** Raydium and Jupiter detection verifies the
  instruction *type* — a checked discriminator byte for Raydium, a computed Anchor
  sighash for Jupiter — but not the account-list layout needed to read input/output
  mints and amounts. Those fields stay `null` and the status stays `candidate`.
  Guessing them would produce plausible, wrong data; that is worse than an honest gap.
- **The live WebSocket alert stream is unexercised against a real endpoint.** It is
  unit-tested against a mocked RPC client only. Separately, many public RPC endpoints
  restrict log subscriptions, so production use needs a dedicated provider.
- **No live deployment yet.** The Docker image builds; it has not been deployed to a

> **Update, Aug 31 2026:** the API has since been deployed and is
> reachable at https://factledger-api.onrender.com/api/v1/health. This document is left as submitted;
> the line above describes the state at submission time.
  public URL. That is Milestone 1 below and the most immediate use of this grant.
- **No users yet.** There are no usage numbers, and this proposal claims none.

## 6. Milestones and budget

**Milestone 1 — Production deployment and monitoring · $8,000 · Months 1–2**
Deploy the existing Docker image to a public URL; move onto a dedicated Solana RPC
provider (the free endpoints restrict both rate and WebSocket subscriptions); add
error tracking and uptime monitoring; publish deployment documentation and worked
API examples.
*Deliverable:* a public API endpoint serving real wallet analysis, monitored.

**Milestone 2 — Extended verified protocol coverage · $9,000 · Months 3–4**
Research and independently verify program IDs and instruction layouts for Orca,
Magic Eden and Phantom Swap, and — where the account layout can be verified —
promote existing adapters from `candidate` to `confirmed` with real amount
extraction. Benchmark against production RPC volume. Publish a technical writeup on
confidence-tiered protocol detection.
*Deliverable:* additional protocols supported at honestly-labelled confidence, with
the verification method documented.

**Milestone 3 — Ecosystem integration and sustainability · $8,000 · Months 5–6**
Support integration into community applications via REST and MCP; reliability
hardening under real traffic; establish a sustainability model so the service
outlives the grant period.
*Deliverable:* documented integrations and a funding path beyond this grant.

## 7. Why this matters for Solana

Wallet reputation and risk data increasingly gate real decisions — protocol access,
counterparty trust, compliance workflows. When that data is a black box, mistakes
are invisible and uncorrectable. FactLedger offers the ecosystem a reference
implementation for the opposite approach: scores that cite their evidence,
confidence that is tiered honestly, and gaps that are stated rather than filled with
guesses. It is open source, so any team can audit the method or build on it.

## 8. Links

- Repository: https://github.com/fas988840-dev/PROJECT-x
- Live project page: https://claude.ai/code/artifact/d4bd6b65-b871-4e54-a0e6-ae418bc3e4be
- Passing CI run: https://github.com/fas988840-dev/PROJECT-x/actions/runs/33347156720
- Contact: fas988840@gmail.com
