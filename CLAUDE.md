# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PROJECT-X is a **read-only** Solana wallet analysis and intelligence platform (package name: `solana-wallet-intelligence`). It exposes a REST API that turns raw on-chain data into deterministic behavioral metrics, an "intelligence" score, and a risk assessment for a given wallet address.

The platform never requests or stores private keys/seed phrases/secrets and never signs transactions — it only reads from Solana RPC. This constraint shapes the entire codebase (see "Core design invariants" below) and should not be relaxed when adding features.

## Commands

```bash
npm run dev            # Run the server with hot reload (tsx watch)
npm run build           # Type-compile to dist/ via tsc
npm start               # Run the compiled server (node dist/index.js)

npm test                 # Run all tests once (vitest run)
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage

npm run type-check      # tsc --noEmit
npm run lint             # eslint src --ext .ts
npm run lint:fix        # eslint --fix
```

To run a single test file with Vitest: `npx vitest run src/services/instruction-parser.test.ts`. To run a single test by name: `npx vitest run -t "should return unknown status"`.

Tests live next to the code they test as `*.test.ts` (e.g. `src/services/instruction-parser.test.ts`), not in a separate `test/` directory. `tsconfig.json` excludes `**/*.test.ts` from the build.

### ⚠️ Known repo inconsistencies (verify before relying on `npm run dev`/`npm test`)

- `package.json`'s `dev`/`start` scripts point at `src/index.ts` / `dist/index.js`, but the actual entry point is `src/main.ts`. `npm run dev` will fail until this is fixed (either rename `main.ts` to `index.ts` or update the script).
- `src/api/server.ts` imports `cors`, and `src/api/server.test.ts` imports `supertest`, but neither package (nor their `@types/*`) is listed in `package.json`. Installing them is required before the API server or its tests will run.
- `apps/api/src/solana.ts` is an empty file, apparently a leftover from before the project moved to the `src/` layout. `apps/` is not part of the active codebase — all real code lives under `src/`.

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
- `src/api/server.ts` — Express app: middleware (CORS, JSON body limit, request logging), routes, centralized error handler.
- `src/main.ts` — composition root: reads env vars, constructs every service, injects them into `APIServer`, starts listening.

## Core design invariants

These constraints are enforced throughout the codebase and are called out explicitly in file-level comments — preserve them when modifying or extending services:

- **Never fabricate blockchain data.** When a value is unknown/unavailable (price, fee, block time, decoded instruction), return `null` or an explicit `'unknown'`/`'unknown'` status instead of guessing or defaulting. `StubPriceProvider` always returns `priceUSD: null` for this reason — do not hardcode or approximate prices.
- **Preserve precision for on-chain amounts.** Amounts and fees are kept as `string` (Lamports/raw token amounts), never as `number`, to avoid float precision loss. `token-balance-delta.ts`'s `normalizeAmount()` returns `null` rather than a lossy value when an amount exceeds what can be safely represented as a JS `number`.
- **Read-only, no signing, no secrets.** `SolanaRpcClient` only ever calls read methods on `Connection` (`getSignaturesForAddress`, `getParsedTransaction`, `getParsedTokenAccountsByOwner`, `getBalance`, `getSlot`). Nothing in the codebase should request or persist private keys, seed phrases, or credentials.
- **DEX/program identification is honest about confidence.** `DexRegistry` only registers adapters with verified program IDs; `InstructionParser`/`ParsedInstructionStatus` distinguishes `confirmed` (known adapter decoded it) from `candidate` (looks like a swap but unverified) from `unknown` — never collapse this distinction to make output look more complete than it is. The Raydium/Jupiter decoders in `dex-registry.ts` are explicitly unimplemented placeholders (`decode()` always returns `null`) — do not treat their presence as working swap detection.
- **Scores must stay explainable.** `IntelligenceScorer` and `RiskAssessor` are deterministic weighted combinations of named factors, and both return a `factors`/`reasoning` string array alongside the numeric score. Any new scoring signal should be similarly deterministic (reproducible from the same input) and paired with a human-readable explanation — not an opaque ML output.
- **Responses always carry a disclaimer.** Intelligence/risk/analysis endpoints return a `disclaimer` field stating the data is not financial advice. Keep this on any new endpoint that surfaces a score.

## Conventions

- ESLint: `@typescript-eslint/no-explicit-any` is an **error** (avoid `any`; the API server test file's `mockTransactionRetriever: any` predates/is exempt from this in practice but new code should type mocks properly). `no-unused-vars` is an error except for `_`-prefixed args (used throughout for intentionally-ignored `catch` params and unused handler params, e.g. `(_error)`, `(_req: Request, ...)`). `explicit-function-return-types` and `no-console` are warnings only.
- `tsconfig.json` runs in `strict` mode with `noUnusedLocals`/`noUnusedParameters`/`noImplicitReturns`/`noFallthroughCasesInSwitch` all on — write code that satisfies these rather than suppressing them.
- Services are plain classes with constructor-injected dependencies (see `main.ts` for the wiring order) — no DI framework. When adding a new service, follow the same pattern: a class taking its dependencies via constructor, instantiated once in `main.ts`.
- Tests use `vitest` (`describe`/`it`/`expect`, `vi.fn()` for mocks) and are colocated with the source file under the same directory.
