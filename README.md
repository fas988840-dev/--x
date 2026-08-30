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
`research_report`, `market_events`. This is **deterministic dispatch**,
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

## MCP Server

In addition to the REST API, `src/mcp/` exposes the same read-only pipeline
as an [MCP](https://modelcontextprotocol.io) server, so MCP-compatible
clients (Claude Desktop, Claude Code, other MCP hosts) can call it directly
as tools, over stdio.

```bash
npm run mcp
```

**Tools exposed:** `wallet_intelligence`, `transaction_lookup`,
`wallet_risk`, `wallet_research_report`, `market_events` - each is a thin
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
- [x] Read-only agent facades (`src/agents/core_agents.ts`) - no LLM calls, honest UNKNOWN when data isn't real
- [x] Evidence Engine (`src/agents/evidence-engine.ts`) - per-instruction evidence, fixed confidence mapping
- [x] Agent Router (`src/agents/agent-router.ts`) - deterministic dispatch, no NLP
- [~] MCP server (`src/mcp/`) - implemented, **API surface unverified** (docs were unreachable when written; run `npm install && npm test` before relying on it)
- [x] CI (`.github/workflows/ci.yml`) - npm audit, lint, type-check, test (incl. an automated determinism check), build, on every push/PR
- [x] Dependabot (`.github/dependabot.yml`) - weekly npm + GitHub Actions update PRs
- [ ] Real price provider (CoinGecko/Birdeye)
- [ ] DEX protocol adapters (Raydium, Jupiter, etc.)
- [ ] Alert system
- [ ] Track record database
- [ ] Dashboard UI
- [ ] WebSocket support

## Repository Status

**PRIVATE REPOSITORY** - This repository must remain private. Do not make public.

## License

Copyright © 2026 FactLedger. All rights reserved.

This software is proprietary. See [LICENSE](./LICENSE) for full terms. No part of this repository may be copied, modified, distributed, or used without express written permission from the copyright holder.

## Support

For issues or questions, contact the development team.
