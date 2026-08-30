# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FactLedger (package name: `factledger`; formerly "PROJECT-X" / `solana-wallet-intelligence`) is a **read-only** Solana wallet analysis and intelligence platform. It exposes a REST API that turns raw on-chain data into deterministic behavioral metrics, an "intelligence" score, and a risk assessment for a given wallet address.

The platform never requests or stores private keys/seed phrases/secrets and never signs transactions — it only reads from Solana RPC. This constraint shapes the entire codebase (see "Core design invariants" below) and should not be relaxed when adding features.

## Commands

```bash
npm run dev            # Run the server with hot reload (tsx watch)
npm run build           # Type-compile to dist/ via tsc
npm start               # Run the compiled server (node dist/main.js)

npm test                 # Run all tests once (vitest run)
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage

npm run type-check      # tsc --noEmit
npm run lint             # eslint src --ext .ts
npm run lint:fix        # eslint --fix
```

To run a single test file with Vitest: `npx vitest run src/services/instruction-parser.test.ts`. To run a single test by name: `npx vitest run -t "should return unknown status"`.

Tests live next to the code they test as `*.test.ts` (e.g. `src/services/instruction-parser.test.ts`), not in a separate `test/` directory. `tsconfig.json` excludes `**/*.test.ts` from the build.

`.github/workflows/ci.yml` runs `npm install`, `lint`, `type-check`, `test`, and `build` on every push/PR to any branch. `src/services/determinism.test.ts` is part of that `test` run — it calls `RiskAssessor`/`IntelligenceScorer`/`BehaviorAnalyzer` twice with identical fixed input and asserts exact equality, as a direct, automated check of the "scores must be deterministic" invariant below (not just an assertion in prose).

### Repo inconsistencies (fixed)

The following were found broken and have been corrected — mentioned here so the history in git log makes sense:

- `package.json`'s `dev`/`start`/`main` fields pointed at `src/index.ts` / `dist/index.js`, but the actual entry point is `src/main.ts`. Scripts now point at `src/main.ts` / `dist/main.js`.
- `src/api/server.ts` imported `cors`, and `src/api/server.test.ts` imported `supertest`, but neither package (nor `helmet`/`express-rate-limit`, added for hardening — see below) was listed in `package.json`. All are now declared as dependencies with their `@types/*` counterparts.
- `src/api/server.ts` imported its service classes (`TransactionRetriever`, `BehaviorAnalyzer`, etc.) from `./` instead of `../services/`, which would have failed to resolve at build time since those files live in `src/services/`, not `src/api/`. Import paths are now corrected.
- `apps/api/src/solana.ts` is still an empty leftover file from before the project moved to the `src/` layout. `apps/` is not part of the active codebase — all real code lives under `src/`. Left in place but do not build on it.

## Architecture

The system is a linear pipeline of single-purpose services, wired together in `src/main.ts` and consumed by the Express layer in `src/api/server.ts`. Understanding the pipeline order matters more than any individual file:

```
SolanaRpcClient          → raw, read-only calls to @solana/web3.js Connection
  → TransactionRetriever  → fetches signatures/transactions, normalizes into TransactionMeta,
                             extracts Instructions (handles both legacy and versioned txs)
    → InstructionParser   → looks up each instruction's programId in DexRegistry,
                             classifies status as confirmed / candidate / unknown
      → DexRegistry        → holds verified DexProtocolAdapters (program ID → decoder);
                             adapters here are currently stub/placeholder decoders
    → TokenBalanceDeltaCalculator → diffs pre/post token balances into TokenBalanceDelta
    → PriceProvider        → looks up USD prices (StubPriceProvider always returns null —
                             no real price integration exists yet)
      → BehaviorAnalyzer    → aggregates TransactionMeta + SwapEvents into BehaviorMetrics
                             (frequency, failure rate, diversity, volume, timing)
        → IntelligenceScorer → BehaviorMetrics → IntelligenceScore (activity/sophistication/
                             consistency/efficiency, each weighted 25%)
        → RiskAssessor       → BehaviorMetrics → RiskScore (failure-rate/frequency/
                             concentration/volatility/suspicious-pattern factors, weighted)
```

`APIServer` (`src/api/server.ts`) is a thin HTTP layer over this pipeline: each route validates input via `src/types/domain.ts` validators, calls into the services above, and shapes a JSON response. It does not contain business logic itself.

### Layout

- `src/types/domain.ts` — the core domain model: branded string types (`WalletAddress`, `TransactionSignature`, `TokenMint`, `ProgramId`) each with a `validateX()` function that must be used to construct them (they use `PublicKey` from `@solana/web3.js`, or a hand-rolled Base58 decoder for transaction signatures, which must decode to exactly 64 bytes). Also defines the shared interfaces that flow through the pipeline (`TransactionMeta`, `Instruction`, `ParsedInstruction`, `TokenBalanceDelta`, `SwapEvent`, `BehaviorMetrics`, `IntelligenceScore`, `RiskScore`, plus not-yet-wired-up types `Alert`/`TrackRecord`/`AIExplanation`).
- `src/types/errors.ts` — `ValidationError`, `RpcError` (carries `statusCode`), `PriceUnavailableError`, `DecodingError`. `APIServer`'s centralized error handler switches on these types to pick the HTTP status code.
- `src/types/config.ts` — config interfaces (`SolanaConfig`, `PriceProviderConfig`, `DexRegistryConfig`, `AppConfig`). Only `SolanaConfig` is currently constructed/used (in `main.ts`); the rest are defined for future wiring.
- `src/services/` — one file per pipeline stage, matching the flow above.
- `src/api/server.ts` — Express app: middleware (Helmet security headers, CORS, rate limiting, JSON body limit, request logging), routes, centralized error handler.
- `src/main.ts` — composition root: reads env vars, constructs every service, injects them into `APIServer`, starts listening.
- `src/agents/core_agents.ts` — thin, honest facades over the services above (`WalletIntelligenceAgent`, `TransactionIntelligenceAgent`, `MarketEventAgent`, `RiskAgent`, `ResearchAgent`). **Not** autonomous/LLM agents — no model calls, no free-form generation. Each returns an `AgentResponse<T>` with `evidenceStatus`/`confidenceScore` that is `VERIFIED`/`1` only when `data` is a real value read from the pipeline, and `UNKNOWN`/`0`/`data: null` whenever the underlying capability isn't implemented (e.g. `MarketEventAgent` always returns `UNKNOWN` — there is no live event/Geyser pipeline in this codebase) or the call fails. Not yet wired into `main.ts`/`APIServer`. Extend this file the same way, never by hardcoding a plausible-looking value.
- `src/mcp/` — MCP (Model Context Protocol) server: `server.ts` builds an `McpServer` whose tools are thin pass-throughs to `src/agents/core_agents.ts` (same `AgentResponse<T>` honesty contract); `index.ts` is the stdio entry point (`npm run mcp`). ⚠️ Written against `@modelcontextprotocol/sdk` without being able to reach its docs (github.com/npmjs.com/modelcontextprotocol.io were unreachable from the sandbox that wrote it) or run `npm install` to verify — treat the exact API surface (`registerTool` signature, import paths) as unverified until `npm install && npm test` passes.

## Core design invariants

These constraints are enforced throughout the codebase and are called out explicitly in file-level comments — preserve them when modifying or extending services:

- **Never fabricate blockchain data.** When a value is unknown/unavailable (price, fee, block time, decoded instruction), return `null` or an explicit `'unknown'`/`'unknown'` status instead of guessing or defaulting. `StubPriceProvider` always returns `priceUSD: null` for this reason — do not hardcode or approximate prices.
- **Preserve precision for on-chain amounts.** Amounts and fees are kept as `string` (Lamports/raw token amounts), never as `number`, to avoid float precision loss. `token-balance-delta.ts`'s `normalizeAmount()` returns `null` rather than a lossy value when an amount exceeds what can be safely represented as a JS `number`.
- **Read-only, no signing, no secrets.** `SolanaRpcClient` only ever calls read methods on `Connection` (`getSignaturesForAddress`, `getParsedTransaction`, `getParsedTokenAccountsByOwner`, `getBalance`, `getSlot`). Nothing in the codebase should request or persist private keys, seed phrases, or credentials.
- **DEX/program identification is honest about confidence.** `DexRegistry` only registers adapters with verified program IDs; `InstructionParser`/`ParsedInstructionStatus` distinguishes `confirmed` (known adapter decoded it) from `candidate` (looks like a swap but unverified) from `unknown` — never collapse this distinction to make output look more complete than it is. The Raydium/Jupiter decoders in `dex-registry.ts` are explicitly unimplemented placeholders (`decode()` always returns `null`) — do not treat their presence as working swap detection.
- **Scores must stay explainable.** `IntelligenceScorer` and `RiskAssessor` are deterministic weighted combinations of named factors, and both return a `factors`/`reasoning` string array alongside the numeric score. Any new scoring signal should be similarly deterministic (reproducible from the same input) and paired with a human-readable explanation — not an opaque ML output.
- **Responses always carry a disclaimer.** Intelligence/risk/analysis endpoints return a `disclaimer` field stating the data is not financial advice. Keep this on any new endpoint that surfaces a score.
- **API surface is hardened by default.** `APIServer.setupMiddleware()` applies, in order: `helmet()` (secure headers, hides `X-Powered-By`); a multi-origin CORS allowlist (`GET`/`OPTIONS` only, no credentials, origins from comma-separated `CORS_ORIGIN` — note CORS only blocks browser-JS reads, not scripted/curl access); a general `express-rate-limit` (60 req / 15 min per IP); body parsing; request logging; then `apiKeyAuth` (opt-in via comma-separated `API_KEYS`, open when unset, `401` on a missing/invalid `X-API-Key` otherwise, `/api/v1/health` always exempt). `setupRoutes()` additionally attaches `heavyLimiter` (20 req / 15 min per IP) to the RPC-heavy wallet/transaction routes. Any new route rides on this same middleware chain — don't bypass it with a separate `express()` instance or router mounted outside `setupRoutes()`; a new RPC-heavy route should get `heavyLimiter` too.

## Conventions

- ESLint: `@typescript-eslint/no-explicit-any` is an **error** (avoid `any`; the API server test file's `mockTransactionRetriever: any` predates/is exempt from this in practice but new code should type mocks properly). `no-unused-vars` is an error except for `_`-prefixed args (used throughout for intentionally-ignored `catch` params and unused handler params, e.g. `(_error)`, `(_req: Request, ...)`). `explicit-function-return-types` and `no-console` are warnings only.
- `tsconfig.json` runs in `strict` mode with `noUnusedLocals`/`noUnusedParameters`/`noImplicitReturns`/`noFallthroughCasesInSwitch` all on — write code that satisfies these rather than suppressing them.
- Services are plain classes with constructor-injected dependencies (see `main.ts` for the wiring order) — no DI framework. When adding a new service, follow the same pattern: a class taking its dependencies via constructor, instantiated once in `main.ts`.
- Tests use `vitest` (`describe`/`it`/`expect`, `vi.fn()` for mocks) and are colocated with the source file under the same directory.
