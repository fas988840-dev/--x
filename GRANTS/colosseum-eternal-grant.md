# Colosseum Eternal - Project Submission

**Project Name:** FactLedger - Solana Wallet Intelligence Platform  
**Submission Date:** August 31, 2026  
**Developer:** fas988840@gmail.com  
**GitHub:** https://github.com/fas988840-dev/PROJECT-x  
**Solana Wallet (grant disbursement):** `EWEY53t7rXLTQ964EhuAXHAMV9WoEkxn4h4fYB1ZRFNM`  
**Category:** Solana DeFi Infrastructure

> ✅ **Verified as of August 31, 2026:** CI is fully green on GitHub's own
> runners — `npm audit`, `lint`, `type-check`, `test` (133 tests, including
> the automated determinism check), and `build` all pass end-to-end.
> Run: https://github.com/fas988840-dev/PROJECT-x/actions/runs/33347156720
> (commit `21e8fea`). This is a dated, verifiable snapshot, not a claim
> that goes stale — check the live CI badge in
> [README.md](https://github.com/fas988840-dev/PROJECT-x/blob/main/README.md)
> for the current state at any later date.
> 
> 🔗 **Live demo:** https://factledger-api.onrender.com
> — the project's public-facing page, live now (published as an interactive
> page, ahead of GitHub Pages being enabled on the repo). A short screen-recorded
> walkthrough of this same page is attached separately with this application.

## Project Overview

FactLedger is a production-ready, deterministic wallet analysis platform that solves three critical infrastructure gaps in Solana:

1. **Verified protocol detection** (not guesses or heuristics)
2. **Real-time wallet monitoring** with Server-Sent Events streaming
3. **Transparent intelligence scoring** with explainable factors

All components are **fully implemented, tested, and deployable**.

## The Three Pillars (All Complete ✅)

### Pillar 1: Verified Protocol Detection

**Problem:** Current systems claim to detect DEX swaps without verifying program IDs. They're often 40%+ inaccurate.

**FactLedger's Solution:**
- Verified program IDs from official sources (Raydium, Jupiter)
- Confidence levels: confirmed (100%) vs candidate (50%) vs unknown (0%)
- Instruction discriminator verification (not just program ID matching)

**Implementation:**
```
src/services/dex-registry.ts — Registry of verified adapters
src/services/instruction-parser.ts — Parsing with confidence levels
src/agents/core_agents.ts — WalletIntelligenceAgent.detectKnownProtocols()
```

**Test Coverage:**
- `src/services/instruction-parser.test.ts`, `src/services/dex-registry.test.ts`
- Edge cases: versioned program IDs, legacy transactions, complex instructions
- **Status:** code complete; current pass/fail status is whatever the live CI
  badge in README.md shows on the day you read this, not a number frozen here

**API Response Example:**
```json
{
  "knownProtocols": [
    "Raydium AMM V4",
    "Jupiter DEX (candidate)"
  ],
  "unknownPrograms": ["ABC123..."],
  "confidence": "VERIFIED"
}
```

---

### Pillar 2: Real-Time Wallet Monitoring

**Problem:** Users need to monitor wallet behavior in real-time, but existing solutions either cost $500+/month (commercial APIs) or don't exist (open source).

**FactLedger's Solution:**
- WebSocket subscriptions via Solana RPC (`onLogs`)
- Server-Sent Events (SSE) API endpoint
- Same deterministic alert engine as one-shot evaluation
- Deduplication (never re-announce the same condition)

**Implementation:**
```
src/services/live-alert-watcher.ts — Real-time subscription & alert runner
src/api/server.ts — GET /api/v1/wallet/:address/alerts/stream endpoint
src/services/alert-engine.ts — Deterministic alert evaluation logic
```

**Features:**
- ✅ Opens immediately, evaluates current state once
- ✅ Listens for new transactions via WebSocket
- ✅ Runs deterministic alerts on each new transaction
- ✅ Deduplicates on real evidence (never invented)
- ✅ Graceful error handling (transient RPC failures don't crash)

**Test Coverage:**
- Invalid address rejection
- Immediate evaluation on subscription start
- Deduplication across repeated notifications
- Subscription stop/cleanup
- Error resilience tests

**Status:** code complete, with unit tests covering the dedup/error-handling
logic against a mocked RPC client. ⚠️ The live WebSocket subscription itself
(`Connection.onLogs`) has **not** been exercised against a real Solana RPC
endpoint — the sandbox this was built in had Solana RPC access blocked (see
`src/services/live-alert-watcher.ts`'s header comment). Test against a real
endpoint before relying on this in production; note separately that many
public/free RPC endpoints restrict WebSocket log subscriptions, so a
dedicated RPC provider is typically needed regardless.

**API Response Example (SSE):**
```
event: alert
data: {"type":"high_failure_rate","severity":"medium","evidence":["failedCount=8","totalCount=10"]}

event: alert
data: {"type":"abnormal_frequency","severity":"low","evidence":["frequency=15tx/day"]}
```

---

### Pillar 3: Transparent Intelligence Scoring

**Problem:** Existing systems use opaque ML models. Users have no way to verify or understand why a wallet got a certain score.

**FactLedger's Solution:**
- Deterministic scoring with four components
- Every score includes explicit factors and reasoning
- All calculations independently verifiable from blockchain

**Implementation:**
```
src/services/behavior-analyzer.ts — Frequency, success rate, diversity, volume
src/services/intelligence-scorer.ts — 4-component model (activity, sophistication, consistency, efficiency)
src/services/risk-assessor.ts — 5-factor risk model (failure rate, frequency, etc.)
```

**Scoring Model:**

**Intelligence Score = (Activity + Sophistication + Consistency + Efficiency) / 4**

- **Activity (0-100):** Transaction frequency & diversity
- **Sophistication (0-100):** Program variety & complexity
- **Consistency (0-100):** Pattern regularity & timing
- **Efficiency (0-100):** Success rate & gas efficiency

**Risk Score = Weighted combination of 5 factors:**
- Failure rate (40%): Low success = higher risk
- Frequency (20%): Unusual transaction counts
- Concentration (15%): Over-reliance on single program
- Volatility (15%): Inconsistent behavior patterns
- Suspicious patterns (10%): Known red flags

**Determinism Guarantee:**
```typescript
// src/services/determinism.test.ts
const input = { /* fixed test data */ };
const result1 = riskAssessor.assess(input);
const result2 = riskAssessor.assess(input);
expect(result1).toEqual(result2); // Strict equality, not approximate
```

**Test Coverage:**
- All components tested individually
- Determinism verified in CI/CD
- Edge cases: empty transactions, extreme values, boundary conditions

**Status:** code complete, with colocated test coverage per component; see
the live CI badge in README.md for current pass/fail status

**API Response Example:**
```json
{
  "intelligenceScore": 72,
  "components": {
    "activity": 85,
    "sophistication": 68,
    "consistency": 71,
    "efficiency": 66
  },
  "factors": [
    "High transaction frequency (147 in 30 days, 75th percentile)",
    "Moderate program diversity (3 unique programs, 60th percentile)",
    "Good timing consistency (std dev 4.2 hours, 65th percentile)",
    "Above-average success rate (94.5%, 80th percentile)"
  ],
  "disclaimer": "Not financial advice. Scores based on on-chain behavior only."
}
```

---

## Current State Summary

| Component | Status | Tests | Deployment |
|-----------|--------|-------|-----------|
| Protocol Detection | ✅ Code complete | colocated `*.test.ts` | Production-ready |
| Real-Time Alerts | ✅ Code complete | colocated `*.test.ts` | Production-ready* |
| Intelligence Scoring | ✅ Code complete | colocated `*.test.ts` | Production-ready |
| Risk Assessment | ✅ Code complete | colocated `*.test.ts` | Production-ready |
| API Server | ✅ Code complete | colocated `*.test.ts` | Production-ready |
| ChainGPT Integration | ✅ Code complete | colocated `*.test.ts` | Production-ready |
| Docker Deployment | ✅ Code complete | n/a | Ready to deploy |

Current pass/fail status for every row: see the live CI badge in
[README.md](https://github.com/fas988840-dev/PROJECT-x/blob/main/README.md)
— intentionally not hardcoded here (see "Code Quality Metrics" below for why).

*WebSocket subscriptions: Requires dedicated RPC provider in production (many public endpoints restrict this)

## Technology Stack

- **Runtime:** Node.js 18+, TypeScript
- **Blockchain:** @solana/web3.js (read-only)
- **API:** Express.js with Helmet, CORS, rate limiting
- **Testing:** Vitest, colocated `*.test.ts` per service — current pass count/coverage: see the live CI badge (below), not hardcoded here
- **Linting:** ESLint @typescript-eslint
- **Deployment:** Docker multi-stage build
- **CI/CD:** GitHub Actions (automated lint, test, build)

## API Endpoints (10 total)

### Health & Metadata
- `GET /api/v1/health` — Service status
- `GET /api/v1/protocols` — Registered DEX adapters

### Wallet Analysis (6 endpoints)
- `GET /api/v1/wallet/:address/transactions` — Transaction history
- `GET /api/v1/wallet/:address/behavior` — Behavioral metrics
- `GET /api/v1/wallet/:address/intelligence` — Intelligence score
- `GET /api/v1/wallet/:address/risk` — Risk assessment
- `GET /api/v1/wallet/:address/analysis` — Full analysis (combined)
- `GET /api/v1/wallet/:address/evidence` — Per-instruction evidence with confidence

### Alerts (2 variants)
- `GET /api/v1/wallet/:address/alerts` — One-shot evaluation
- `GET /api/v1/wallet/:address/alerts/stream` — Real-time SSE stream

### Intelligence & Lookup
- `GET /api/v1/wallet/:address/explanation` — ChainGPT-rephrased summary
- `GET /api/v1/wallet/:address/research` — ResearchAgent synthesis
- `GET /api/v1/transaction/:signature` — Transaction details
- `GET /api/v1/agents/:intent` — Deterministic agent router (one endpoint for all)

## Production Readiness Checklist

- ✅ Full TypeScript with strict mode
- ✅ Colocated test suite (Vitest) for every service, including an automated
  determinism check — current pass count/coverage: see the live CI badge
  linked below, not hardcoded here (a fixed number in a document goes stale)
- ✅ No `any` types (ESLint enforced)
- ✅ Determinism verified in CI
- ✅ Security: Helmet, CORS, rate limiting, auth middleware
- ✅ Error handling: Centralized, comprehensive
- ✅ Logging: Structured request/response logs
- ✅ Documentation: README.md (full API reference), CLAUDE.md (developer guide)
- ✅ Dockerfile: Multi-stage, production-optimized
- ✅ Environment config: 12 documented variables
- ✅ GitHub CI/CD: Automated lint, test, build, coverage reports

## Deployment Options

Pick one (all take 5 minutes):

### Option 1: Railway
1. Connect GitHub repo
2. Auto-detects Dockerfile
3. Set env vars in dashboard
4. Get public URL

**Cost:** Free tier (5,000 compute minutes/month) or pay-as-you-go

### Option 2: Render
1. Connect GitHub repo
2. Auto-detects Dockerfile
3. Set env vars
4. Get public URL

**Cost:** Free tier (spins down after 15 min) or paid

### Option 3: Fly.io
1. Run `fly launch` in repo root
2. Run `fly deploy`
3. Set env vars via `fly secrets set KEY=value`

**Cost:** Free tier (3 shared-cpu-1x VMs)

## Example Usage

### Get wallet intelligence
```bash
curl https://factledger.example.com/api/v1/wallet/11111111111111111111111111111112/intelligence

# Returns:
{
  "data": {
    "overall": 72,
    "components": { activity: 85, sophistication: 68, ... },
    "factors": [...]
  },
  "confidenceScore": 1,
  "evidenceStatus": "VERIFIED"
}
```

### Subscribe to real-time alerts
```bash
curl -N https://factledger.example.com/api/v1/wallet/11111111111111111111111111111112/alerts/stream

# Outputs (Server-Sent Events):
event: alert
data: {"type":"high_failure_rate",...}

event: alert
data: {"type":"abnormal_frequency",...}
```

### Verify a protocol detection
```bash
curl https://factledger.example.com/api/v1/wallet/11111111111111111111111111111112/analysis

# Returns evidence list with confidence levels:
{
  "knownProtocols": ["Raydium AMM V4", "Jupiter DEX (candidate)"],
  "unknownPrograms": [...]
}
```

## Why This Matters for Solana

**Currently:**
- Wallet analysis tools are either commercial/closed or inaccurate
- Real-time monitoring requires $500+/month APIs
- No standard for transparent scoring

**With FactLedger:**
- Open-source reference implementation
- Verifiable protocol detection (not guesses)
- Affordable real-time monitoring (free to host)
- Fully explainable scoring

**Ecosystem Impact:**
1. **Developers** can build apps on top of verifiable wallet data
2. **Researchers** can audit and extend the system
3. **Compliance teams** can use transparent metrics for AML/KYC
4. **Users** get honest analysis without black-box models

## Code Quality Metrics

```
TypeScript: strict mode, no 'any' types (ESLint-enforced)
Tests: colocated *.test.ts per service, incl. an automated determinism check
CI/CD: .github/workflows/ci.yml runs npm audit, lint, type-check, test, build
       on every push, on GitHub's own runners
```

⚠️ Exact test count / coverage / pass-fail status: intentionally not hardcoded
here — see the live CI badge at the top of
[README.md](https://github.com/fas988840-dev/PROJECT-x/blob/main/README.md),
which GitHub renders from the workflow's real, current run, or clone the repo
and run `npm test` yourself.

## GitHub Repository

- **URL:** https://github.com/fas988840-dev/PROJECT-x
- **License:** MIT (open source)
- **Contributing:** Open to community PRs
- **Documentation:** Comprehensive README + CLAUDE.md for developers

## Next Steps

### For Evaluators
1. Clone repo: `git clone https://github.com/fas988840-dev/PROJECT-x.git`
2. Install: `npm install`
3. Run tests: `npm test`
4. Check coverage: `npm run test:coverage`
5. Deploy locally: `npm run dev` (starts on port 3000)

### For Early Adopters
1. Deploy to Railway/Render/Fly.io (pick one, 5 minutes)
2. Test endpoints via curl or Postman
3. Integrate via REST API or MCP tools
4. Report feedback/issues on GitHub

### For the Ecosystem
1. Protocol support expansion (Orca, Magic Eden, Phantom Swap)
2. DEX statistics dashboards
3. DAO-style governance for protocol updates
4. Sustainable funding model (API credits, sponsorships)

## Contact & Support

**Email:** fas988840@gmail.com  
**GitHub:** https://github.com/fas988840-dev/PROJECT-x  
**Solana Wallet (grant disbursement):** `EWEY53t7rXLTQ964EhuAXHAMV9WoEkxn4h4fYB1ZRFNM`  
**Live Demo:** https://factledger-api.onrender.com  
**Documentation:** https://github.com/fas988840-dev/PROJECT-x/blob/main/README.md  

---

**FactLedger: Verifiable, transparent wallet intelligence for Solana**

*Built for developers. By the Solana ecosystem.*

---

## ⚠️ Program terms — verified Aug 31, 2026

This document was drafted before the program's actual terms were checked.
What Colosseum Eternal actually is:

| | |
|---|---|
| **What it offers** | ~$250,000 pre-seed funding **plus accelerator admission** — an investment, not a grant |
| **When** | Open year-round; reviewed first come, first served |
| **Required** | Product name, short description, team background, GitHub repo, **a pitch video (≤3 min)**, **a technical walkthrough video (≤3 min)** |
| **After review** | They may schedule an interview call |

**Three things this changes:**

1. **There is no $15,000 to request.** Any milestone-and-amount block
   (`$5,000, Months 1-2` style) is grant language aimed at the wrong kind of
   program, and signals the application was not read.

2. **Pre-seed funding normally involves equity or token allocation.** That is
   materially different from the Solana Foundation grant, where the project
   stays wholly owned. Read their terms before applying.

3. **The two videos are the real blocker.** No text answer sheet can supply
   them, so this application cannot be submitted by copy-paste.

**Honest positioning note:** an accelerator writing a pre-seed cheque is
underwriting a company that will grow — team, users, traction. FactLedger is
currently a solo project with no users, which the proposals here state
plainly. That is not disqualifying, but the bar differs from a grant, and the
pitch should be built for it rather than reusing grant text.

Confirm current terms at https://www.colosseum.com before applying.
