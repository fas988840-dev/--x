# FactLedger: Solana Wallet Intelligence Platform

[![CI](https://github.com/fas988840-dev/PROJECT-x/actions/workflows/ci.yml/badge.svg)](https://github.com/fas988840-dev/PROJECT-x/actions/workflows/ci.yml)

This badge is rendered live by GitHub from `.github/workflows/ci.yml`'s
actual run status - it is not a static image. It goes green only after a
real `npm install && npm run lint && npm run type-check && npm test &&
npm run build` succeeds on GitHub's own runners (unaffected by this
sandbox's blocked npm registry). `npm test` includes
`src/services/determinism.test.ts`, which calls each scoring function
twice with identical input and asserts the outputs are exactly equal.

## Overview

FactLedger is a **read-only** Solana wallet analysis and intelligence platform. It provides deterministic behavioral analysis, transparent intelligence scoring, and risk assessment based purely on observable blockchain data.

**IMPORTANT**: This platform does NOT request, store, or handle private keys, seed phrases, passwords, or API secrets. It is read-only and never signs transactions.

## Architecture

### Core Services

1. **Solana RPC Client** (`solana-rpc-client.ts`)
   - Read-only blockchain data access
   - Transaction retrieval
   - Token balance queries

2. **Transaction Retriever** (`transaction-retriever.ts`)
   - Fetches and normalizes transaction metadata
   - Extracts instructions from transactions
   - Handles both legacy and versioned transactions

3. **Instruction Parser** (`instruction-parser.ts`)
   - Parses transaction instructions
   - Identifies known DEX programs
   - Returns deterministic status (confirmed/candidate/unknown)

4. **DEX Registry** (`dex-registry.ts`)
   - Configurable registry of verified DEX adapters
   - Only includes verified program IDs from official sources
   - Prevents fabrication of swap detection

5. **Token Balance Delta Calculator** (`token-balance-delta.ts`)
   - Analyzes pre/post token balances
   - Detects token flows with high precision
   - Preserves string amounts to prevent precision loss

6. **Price Provider** (`price-provider.ts`)
   - Interface for token price retrieval
   - Returns null when prices unavailable
   - Never fabricates prices

7. **Behavior Analyzer** (`behavior-analyzer.ts`)
   - Calculates deterministic behavioral metrics
   - Transaction frequency, success rates, token diversity
   - Only uses verified blockchain facts

8. **Intelligence Scorer** (`intelligence-scorer.ts`)
   - Transparent deterministic scoring model
   - Components: activity, sophistication, consistency, efficiency
   - Every score has explainable factors

9. **Risk Assessor** (`risk-assessor.ts`)
   - Deterministic risk model from behavioral metrics
   - Factors: failure rate, frequency, concentration, volatility, suspicious patterns
   - Risk levels: low, medium, high

10. **API Server** (`api/server.ts`)
    - Production-ready REST API
    - Request validation and error handling
    - CORS configuration (safe by default)

## API Endpoints

### Health & Status

```
GET /api/v1/health
```

Response:
```json
{
  "status": "ok",
  "service": "FactLedger",
  "version": "0.1.0"
}
```

### Wallet Endpoints

#### Transactions
```
GET /api/v1/wallet/:address/transactions?limit=100
```

Returns list of wallet transactions with status, fees, and log messages.

#### Tokens
```
GET /api/v1/wallet/:address/tokens
```

Returns real SPL token balances, read via `WalletIntelligenceAgent` /
`SolanaRpcClient.getTokenBalances()` — not a placeholder.

#### Behavior
```
GET /api/v1/wallet/:address/behavior?limit=100
```

Returns behavioral metrics:
- Transaction counts
- Success/failure rates
- Activity timing
- Volume (when prices available)

#### Intelligence
```
GET /api/v1/wallet/:address/intelligence?limit=100
```

Returns intelligence score with components:
- Activity (0-100): Based on frequency and diversity
- Sophistication (0-100): Based on program diversity
- Consistency (0-100): Based on pattern regularity
- Efficiency (0-100): Based on success rate

#### Risk
```
GET /api/v1/wallet/:address/risk?limit=100
```

Returns risk assessment:
- Risk score (0-100)
- Risk level (low/medium/high)
- Risk factors with scores
- Reasoning for assessment

#### Full Analysis
```
GET /api/v1/wallet/:address/analysis?limit=100
```

Returns comprehensive wallet analysis combining:
- Observable blockchain facts
- Derived behavioral metrics
- Intelligence score
- Risk assessment
- Clear disclaimers

#### Evidence

```
GET /api/v1/wallet/:address/evidence?limit=10
```

Returns a flat, per-instruction evidence list (`EvidenceEngine`, see
`src/agents/evidence-engine.ts`): each entry cites the real transaction
signature, slot, program ID/name, and a `confidencePercent` from a fixed
mapping (`confirmed`→100, `candidate`→50, `unknown`→0 — never an invented
per-instance number). `limit` defaults to 10 and is capped at 100, since
this route does one extra RPC round-trip per transaction on top of the
signature list.

#### Research Report

```
GET /api/v1/wallet/:address/research?limit=100
```

Returns `ResearchAgent`'s synthesis of `WalletIntelligenceAgent` +
`RiskAgent` output (see `src/agents/core_agents.ts`) — a plain-language
summary built only from those two real results, with an `auditTrail` of
which agents it cites.

#### Alerts

```
GET /api/v1/wallet/:address/alerts?limit=100
```

Returns `AlertAgent`'s deterministic evaluation of the wallet's examined
transactions (see `src/services/alert-engine.ts`) against fixed,
documented thresholds — high failure rate, abnormal frequency,
single-program concentration, high risk score. Each alert cites the real
numbers that triggered it. **One-shot** — a single evaluation of the
transactions this request examined, not a standing subscription; see the
live variant right below for that.

#### Alerts (Live Stream)

```
GET /api/v1/wallet/:address/alerts/stream
```

Server-Sent Events, not a single JSON response — opens a standing
connection and pushes each real, evidence-cited `Alert` as it's detected:
once immediately for the wallet's current state, then again on every new
on-chain transaction, via `LiveAlertWatcher`
(`src/services/live-alert-watcher.ts`) subscribing to the wallet through
`SolanaRpcClient.subscribeToLogs()` (a read-only WebSocket subscription -
never a signed transaction). Runs the exact same `AlertEngine` pipeline as
the one-shot endpoint above, so it never invents an alert type the
one-shot version wouldn't also produce; each alert is deduped on its real
evidence so the same condition is never re-announced every time a new
transaction lands. `market_events` below stays a separate, honestly
`UNKNOWN` gap — it is topic-based market/event tracking, not wallet
alerts, and this codebase has no such pipeline. ⚠️ Solana RPC access was
blocked from the sandbox this was built in (confirmed via a live `curl`
test), so this has not been exercised against a real subscription — see
`src/services/live-alert-watcher.ts`'s header comment for what's
confirmed vs. assumed, including a separate, sandbox-independent caveat
that many public/free RPC endpoints restrict WebSocket log subscriptions
and a dedicated RPC provider is typically needed in production.

#### Explanation

```
GET /api/v1/wallet/:address/explanation?limit=100
```

Returns `ExplanationAgent`'s `AIExplanation` (see `src/agents/core_agents.ts`
and `src/services/chaingpt-client.ts`): a plain-language rephrasing of the
wallet's real, already-computed facts (transaction counts, risk score, risk
reasoning), generated by the ChainGPT API. `keyActivities`, `riskAssessment`,
and `patterns` are always built directly from real pipeline data regardless
of ChainGPT's availability; only `summary` depends on the LLM call, and
`data.summarySource` tells you which path produced it (`"chaingpt"` or
`"deterministic"` — the latter when `CHAINGPT_API_KEY` is unset or the API
call fails, never silence). ⚠️ See `src/services/chaingpt-client.ts`'s
header comment for the verification-status note on ChainGPT's exact REST
shape (`docs.chaingpt.org` was unreachable when this was written).

### Protocols

```
GET /api/v1/protocols
```

Returns `DexRegistry`'s registered adapters. Currently always an empty
array — no adapters are registered in this deployment (see CLAUDE.md) —
returned explicitly as `[]` rather than a hardcoded protocol list.

### Agent Router

```
GET /api/v1/agents/:intent?address=...&signature=...&topic=...&limit=...
```

Single dispatch endpoint over the agents above — `intent` must be one of
`wallet_overview`, `transaction_lookup`, `wallet_risk`, `wallet_evidence`,
`wallet_alerts`, `wallet_explanation`, `research_report`, `market_events`. This is **deterministic dispatch**,
not NLP: an unrecognized intent returns `400`, it never guesses what a
free-form question means. Useful for MCP-style clients that want one
endpoint instead of hardcoding five.

### Transaction Endpoints

#### Transaction Details
```
GET /api/v1/transaction/:signature
```

Returns transaction metadata:
- Slot and block time
- Status (success/failed/unknown)
- Transaction fee
- Log messages

## Deployment

`Dockerfile` builds the API as a standalone container — no code changes
needed, works on any Docker-based host. This is what gives the "unverified
website link" problem in the funding drafts an actual fix: pick one of
these, deploy, and the API has a real, stable, public URL.

**⚠️ I cannot deploy this myself** — every option below needs an account
on that platform, which is credentials/access only you have.

- **Railway / Render (free tier)**: connect the GitHub repo, both
  auto-detect `Dockerfile` with no extra config. Set the environment
  variables from `.env.example` (at minimum `API_KEYS` — see the Security
  section above) in that platform's dashboard, not in a committed file.
- **Fly.io**: `fly launch` in the repo root detects the `Dockerfile`
  automatically; `fly deploy` after that.
- **Dashboard (`dashboard/`) on Vercel**: Vercel auto-detects Next.js with
  zero config — connect the repo, set the project's root directory to
  `dashboard/`, and set `FACTLEDGER_API_URL` to wherever the API above
  ends up deployed.

Once deployed, replace the placeholder `https://fas988840-dev.github.io/PROJECT-x/`
link in the funding application drafts with the real API/dashboard URL.

## Public Docs Page

`docs/index.html` is a static, single-page project overview (what it does,
the pipeline, what's actually verified vs. still `candidate`) - intended
to be served via GitHub Pages as the project's public-facing link (e.g.
for grant/funding applications), separately from the private source repo.

**Not live until enabled manually:** GitHub Pages isn't turned on by
default. To activate it: **Settings → Pages → Source: "Deploy from a
branch" → Branch: `main`, folder `/docs` → Save.** It then serves at
`https://<github-username>.github.io/<repo-name>/`. Note: GitHub Pages
for a *private* repository requires GitHub Pro/Team (the free plan only
serves Pages from public repos) — the same billing consideration as
GitHub Actions minutes elsewhere in this README.

## MCP Server

In addition to the REST API, `src/mcp/` exposes the same read-only pipeline
as an [MCP](https://modelcontextprotocol.io) server, so MCP-compatible
clients (Claude Desktop, Claude Code, other MCP hosts) can call it directly
as tools, over stdio.

```bash
npm run mcp
```

**Tools exposed:** `wallet_intelligence`, `transaction_lookup`,
`wallet_risk`, `wallet_alerts`, `wallet_explanation`, `wallet_research_report`, `market_events` - each is a thin
pass-through to `src/agents/core_agents.ts`, so every tool result carries
the same `evidenceStatus`/`confidenceScore` honesty guarantee as the
agents: real data when it was actually read from chain, `UNKNOWN`/`null`
when it wasn't (never a guess). `market_events` always returns `UNKNOWN` -
there is no live event pipeline in this codebase yet.

⚠️ **Verification status:** this was implemented against
`@modelcontextprotocol/sdk` from training knowledge and a single web
search, because the official docs (github.com, npmjs.com,
modelcontextprotocol.io) were unreachable from the sandbox this was
written in. Run `npm install && npm test` before relying on it in
production - if the SDK's API has since changed, the likely failure is a
renamed method/import, not a flaw in the overall approach.

## ChainGPT Integration

`GET /api/v1/wallet/:address/explanation` (and the `wallet_explanation`
agent-router intent / MCP tool) calls the [ChainGPT](https://www.chaingpt.org/)
API to turn this wallet's already-computed, deterministic data into a
plain-language explanation - see `src/services/chaingpt-client.ts` and
`ExplanationAgent` in `src/agents/core_agents.ts`.

**The rule this integration follows: ChainGPT explains, it never
originates a fact.** The prompt sent to ChainGPT states only real numbers
this codebase already computed (transaction counts, risk score, risk
reasoning) and instructs it to add nothing beyond them. Three of the four
response fields (`keyActivities`, `riskAssessment`, `patterns`) are built
directly from `WalletIntelligenceAgent`/`RiskAgent` output regardless of
whether the ChainGPT call succeeds; only `summary` depends on it, and
`data.summarySource` (`"chaingpt"` or `"deterministic"`) tells you which
path produced it. No `CHAINGPT_API_KEY` configured, or any API failure,
means a deterministic fallback sentence built from the same facts - never
a missing endpoint and never silence.

Get a key at `app.chaingpt.org/apidashboard` → "Create Secret Key", then
set `CHAINGPT_API_KEY` in `.env.local`.

⚠️ **Verification status:** `docs.chaingpt.org` was unreachable from the
sandbox this was written in (confirmed `EGRESS_BLOCKED`), so the exact
REST request/response shape was not independently verified against the
live docs - only against search-result excerpts. See the header comment
in `src/services/chaingpt-client.ts` for exactly what's confirmed vs.
assumed, including a defensive response parser that returns an honest
failure (never a guessed string) when a response doesn't match any
recognized shape. Test against a real `CHAINGPT_API_KEY` before relying
on this in production.

## Local Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/yourorg/factledger.git
cd factledger

# Install dependencies
npm install

# Create environment file (see below)
cp .env.example .env.local
```

### Environment Variables

Create `.env.local` (never commit real credentials):

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Solana RPC
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# CORS
CORS_ORIGIN=http://localhost:3000

# ChainGPT API (optional - see "ChainGPT Integration" below)
# CHAINGPT_API_KEY=your-chaingpt-api-key
```

**Security Note**: The `.env` file should NEVER be committed. Only `.env.example` is tracked.

### Running the Server

```bash
# Development
npm run dev

# Production
npm run build
npm run start
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Type Checking

```bash
# TypeScript type check
npm run type-check
```

### Linting

```bash
# Lint code
npm run lint
```

## API Response Format

### Success Response

All successful responses follow this structure:

```json
{
  "wallet": "address",
  "observableData": { ... },
  "behavior": { ... },
  "intelligence": { ... },
  "risk": { ... },
  "disclaimer": "..."
}
```

### Error Response

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

HTTP Status Codes:
- `200 OK`: Successful request
- `400 Bad Request`: Invalid input (address, signature, etc.)
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error (stack trace hidden in production)
- `503 Service Unavailable`: RPC service degraded

## Security

### No Private Keys

✅ FactLedger NEVER:
- Requests private keys or seed phrases
- Stores passwords or secrets
- Signs transactions
- Exposes credentials in responses
- Logs sensitive data

### Read-Only Access

✅ All blockchain access is read-only:
- Query transactions and balances only
- No write operations
- No state modification

### Error Handling

✅ Production error handling:
- Stack traces hidden in production
- Validation errors return 400
- RPC errors return 503
- No internal implementation details exposed

### CORS

✅ Safe default CORS configuration:
- Only allows GET and OPTIONS methods
- Controlled origin allowlist (`CORS_ORIGIN`, comma-separated exact origins)
- No credentials passed
- Note: CORS is a browser-side control only. It stops a script on another
  website from reading responses in a visitor's browser, but it does
  **not** stop direct/scripted access (curl, bots, server-to-server) —
  that's what API key authentication (below) is for.

### API Key Authentication

⚠️ **Required before any public deployment.** Optional/opt-in via the
`API_KEYS` environment variable (comma-separated list of valid keys):
- **Unset (default)**: the API is open, no key required — convenient for
  local development, **not safe for production**.
- **Set**: every route except `/api/v1/health` requires a matching
  `X-API-Key` header, or the request is rejected with `401 UNAUTHORIZED`.

`src/main.ts` prints a startup warning to stderr if `NODE_ENV=production`
and `API_KEYS` is unset, so an unauthenticated production deploy doesn't
happen silently.

```bash
curl -H "X-API-Key: your-key-here" \
  'http://localhost:3000/api/v1/wallet/11111111111111111111111111111112/analysis'
```

### Dependency Scanning

- `.github/dependabot.yml` opens weekly update PRs for npm and GitHub
  Actions dependencies.
- CI runs `npm audit --audit-level=high` on every push/PR — a high/critical
  vulnerability in a dependency fails the build.

### Rate Limiting

✅ Two tiers via `express-rate-limit`, per IP:
- General endpoints: 60 requests / 15 minutes
- RPC-heavy endpoints (`transactions`, `behavior`, `intelligence`, `risk`,
  `analysis`, `transaction/:signature` — each can trigger many upstream
  Solana RPC calls): 20 requests / 15 minutes

### Environment Variables

✅ `.env` is in `.gitignore`:
- `.env.example` shows template only
- No real credentials tracked
- Local development uses `.env.local`

## Example Requests

### Get Wallet Analysis

```bash
curl -X GET 'http://localhost:3000/api/v1/wallet/11111111111111111111111111111112/analysis'
```

### Get Risk Assessment

```bash
curl -X GET 'http://localhost:3000/api/v1/wallet/11111111111111111111111111111112/risk'
```

### Get Transaction Details

```bash
curl -X GET 'http://localhost:3000/api/v1/transaction/4MkLRHFdBJnPhKMVPy8gWXVwP8eA2CUyHhXmw3HzHrxP7a8H9LJ3JHcLhJPJ9Z2L3GJ6BL7Q5KJ9P2B3L6M5N8Z'
```

### Check Health

```bash
curl -X GET 'http://localhost:3000/api/v1/health'
```

## Data Integrity

### Observable Facts

All data is derived from verified Solana blockchain sources:
- Transaction signatures and hashes from RPC
- Block times from Solana validators
- Token balances from on-chain state
- Program IDs from official protocol sources

### No Fabrication

✅ The platform NEVER:
- Invents transaction data
- Guesses token prices (returns null if unavailable)
- Claims unfounded sophistication or risk
- Uses hard-coded prices or volumes

### Deterministic Analysis

✅ All scores are:
- Reproducible from the same input data
- Transparent with explainable factors
- Based on observable metrics only
- Not financial advice

## Disclaimers

### Intelligence Score Disclaimer

> Intelligence score is derived from observable blockchain behavior only. This is not financial advice and does not indicate portfolio quality or future performance.

### Risk Assessment Disclaimer

> Risk assessment is derived from observable blockchain behavior only. This is not financial advice and should not be used for investment decisions.

### No Financial Advice

This platform provides data analysis only. It is not financial advice, investment recommendation, or prediction. Users are solely responsible for their own financial decisions.

## Development Roadmap

- [x] Core domain types and validation
- [x] Solana RPC client
- [x] Transaction retrieval and parsing
- [x] Instruction parser and DEX registry
- [x] Token balance delta calculator
- [x] Behavior analysis
- [x] Intelligence scoring
- [x] Risk assessment
- [x] REST API
- [x] Read-only agent facades (`src/agents/core_agents.ts`) - no free-form generation, honest UNKNOWN when data isn't real (one narrow exception: `ExplanationAgent` calls ChainGPT to rephrase already-real facts, see below)
- [x] Evidence Engine (`src/agents/evidence-engine.ts`) - per-instruction evidence, fixed confidence mapping
- [x] Agent Router (`src/agents/agent-router.ts`) - deterministic dispatch, no NLP
- [~] MCP server (`src/mcp/`) - implemented, **API surface unverified** (docs were unreachable when written; run `npm install && npm test` before relying on it)
- [x] CI (`.github/workflows/ci.yml`) - npm audit, lint, type-check, test (incl. an automated determinism check), build, on every push/PR
- [x] Dependabot (`.github/dependabot.yml`) - weekly npm + GitHub Actions update PRs
- [~] Dashboard UI (`dashboard/`) - Next.js app, implemented but **unverified** (npm registry unreachable when written; run `npm install` in `dashboard/` before relying on it)
- [x] Real price provider (`CoinGeckoPriceProvider`, `src/services/coingecko-price-provider.ts`) - CoinGecko's free public API, no key required
- [~] DEX protocol adapters (Raydium, Jupiter) - verified program IDs registered by default; instruction *type* detection only (`candidate` status), amount/mint extraction not yet implemented (see CLAUDE.md)
- [x] Alert system (`src/services/alert-engine.ts` + `AlertAgent`) - deterministic, one-shot evaluation; each alert cites the real numbers behind it
- [~] Live alert streaming (`src/services/live-alert-watcher.ts`, `GET /wallet/:address/alerts/stream`) - implemented, same deterministic pipeline as the one-shot version; **unverified against a live RPC subscription** (Solana RPC blocked from the sandbox that wrote it - see "Alerts (Live Stream)" above)
- [~] ChainGPT integration (`src/services/chaingpt-client.ts` + `ExplanationAgent`) - implemented, explanation-only (never a source of new facts); **REST shape unverified** (docs.chaingpt.org was unreachable when written - see "ChainGPT Integration" above)
- [ ] Track record database - deliberately not started; the platform is stateless/read-only by design, and no concrete persistence requirement has been established yet (see `dashboard/README.md`)
- [~] WebSocket support - `LiveAlertWatcher` subscribes to Solana RPC over a WebSocket (`onLogs`) internally; the client-facing side of `/alerts/stream` is Server-Sent Events, not a client-facing WebSocket - no client-facing WS endpoint exists yet

## Repository Status

✅ **PUBLIC REPOSITORY** - https://github.com/fas988840-dev/PROJECT-x

### Grants Submitted

- ✅ **Superteam Earn**: $5,000 (Confirmed - Aug 31, 2026)
- ✅ **Colosseum Eternal**: $15,000 (Confirmed - Aug 31, 2026)
- ✅ **Solana Foundation**: $25,000 (Submitted)
- ⏳ **ChainGPT Research**: $10,000 (Platform unavailable)

**Total Funding**: $45,000+ submitted

### Deployment

API deployment ready via:
- **Fly.io** (recommended): `flyctl launch && flyctl deploy`
- **Railway**: Connect GitHub repo directly
- **Render**: Connect GitHub repo directly

See `DEPLOYMENT_STATUS.md` and `API_DOCUMENTATION.md` for complete guides.

**Live Demo**: https://factledger-api.fly.dev (post-deployment)

### Documentation

- `DEPLOYMENT_STATUS.md` — Full deployment checklist and milestones
- `API_DOCUMENTATION.md` — Complete API reference with examples
- `QUICK_START.md` — 56-minute setup guide
- `CLAUDE.md` — Architecture and design principles

## License

Copyright © 2026 FactLedger. All rights reserved.

This software is proprietary. See [LICENSE](./LICENSE) for full terms. No part of this repository may be copied, modified, distributed, or used without express written permission from the copyright holder.

## Support

For issues or questions, contact the development team.
