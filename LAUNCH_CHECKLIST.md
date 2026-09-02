# FactLedger Launch Checklist

Generated: 2026-09-02  
Branch: `claude/claude-md-docs-zdlvr9`

---

## ✅ VERIFIED (confirmed by automated test or direct code inspection)

### Core Pipeline
- [x] **BehaviorAnalyzer** — zero-value output for empty input, correct failure-rate math (`failedCount / total`), unique program/token counts from injected Sets
- [x] **IntelligenceScorer** — score always in [0, 100], all four component sub-scores present (`activity`, `sophistication`, `consistency`, `efficiency`), factors is a non-empty string array, empty input → score 0
- [x] **RiskAssessor** — score always in [0, 100], level is one of `low|medium|high`, 100% failure → higher score than 0% failure, reasoning array is present and strings are non-empty when populated, five named factor sub-scores (`failureRateScore`, `frequencyScore`, `concentrationScore`, `volatilityScore`, `suspiciousPatternScore`)
- [x] **AlertEngine** — no alerts for normal wallet (0% failure), fires `high_failure_rate` at 100% failure, each alert's evidence array contains non-empty strings, severity values are one of `low|medium|high|critical`
- [x] **Deterministic scoring** — calling BehaviorAnalyzer → IntelligenceScorer / RiskAssessor twice with identical input produces byte-identical scores (`determinism.test.ts` + `pipeline-integration.test.ts`)
- [x] **No fabrication** — `CoinGeckoPriceProvider` returns `null` on failure, `StubPriceProvider` always returns `null`, `ChainGptClient` returns `ok:false` (not a guess) when response doesn't match any recognized shape
- [x] **Amounts as strings** — fees/amounts kept as `string` throughout pipeline, no float conversion

### HTTP API
- [x] **ValidationError → 400** — `validateWalletAddress`, `validateTransactionSignature`, `validateTokenMint`, `validateProgramId` all throw `ValidationError` (not `Error`); centralized error handler maps to 400
- [x] **asyncHandler wrapper** — all async route handlers wrapped; promise rejections reach `next()` → centralized error handler → never unhandled
- [x] **Security headers** — `helmet()` applied first in middleware chain
- [x] **Rate limiting** — general: 60 req/15 min; heavy routes: 20 req/15 min per IP
- [x] **CORS** — GET/OPTIONS only, no credentials, origin allowlist from `CORS_ORIGIN` env var
- [x] **API key auth** — opt-in via `API_KEYS`; `/api/v1/health` always exempt
- [x] **Disclaimer** — intelligence/risk endpoints include `disclaimer` field in response

### ChainGPT Client
- [x] **No-key short-circuit** — `generateExplanation()` returns `{ok:false}` without calling `fetch` when API key is not configured
- [x] **HTTP error handling** — non-2xx response → `ok:false` with status code in reason
- [x] **Network error handling** — `ECONNRESET`/thrown Error → `ok:false` with message in reason
- [x] **AbortError / timeout path** — fetch throws `AbortError` → `ok:false` with "timed out" in reason (15-second AbortController timeout)
- [x] **Response shape parsing** — `{data:{bot}}`, `{bot}`, SSE `data:{text}` chunks, plain text all parsed; unrecognized shape → `ok:false` (never a guess)
- [x] **Request shape** — `POST https://api.chaingpt.org/chat/stream`, Bearer auth, `{model:'general_assistant', question, chatHistory:'off'}`
- [x] **Deterministic fallback** — `ExplanationAgent.explainWallet()` builds a deterministic summary sentence when ChainGPT is unavailable/fails; `summarySource` set to `'deterministic'` vs `'chaingpt'`

### LiveAlertWatcher
- [x] **Invalid address throws synchronously** on `watch()`
- [x] **Immediate initial evaluation** — `watch()` evaluates once before any log notification
- [x] **Deduplication on evidence** — same alert (different random UUID) not re-reported; dedup key is `type|evidence.join('|')`
- [x] **stop() unsubscribes** — calls `rpcClient.unsubscribeFromLogs(subscriptionId)` with correct ID
- [x] **active flag** — stop() sets `active=false`; concurrent in-flight evaluation never calls `onAlert` after stop
- [x] **Transient RPC failure** — `getWalletTransactionsMeta` rejection → logged, not thrown out of notification callback
- [x] **onLogs callback** — re-evaluation fires on new transaction notification, genuinely new alerts reported

### MCP Server
- [x] **Honest tool descriptions** — `market_events` tool explicitly states "ALWAYS returns evidenceStatus UNKNOWN"; `wallet_explanation` explains ChainGPT / deterministic fallback
- [x] **No fabrication** — all tools pass through to real agents; no `UNKNOWN` converted to a fabricated value
- [x] **Import paths** — confirmed against real `@modelcontextprotocol/sdk` after `npm install` succeeded

### Agents
- [x] **WalletIntelligenceAgent** — `evidenceStatus: 'VERIFIED'` / `confidenceScore: 1` only when pipeline returns real data
- [x] **RiskAgent** — same honest evidence contract
- [x] **MarketEventAgent** — always returns `evidenceStatus: 'UNKNOWN'`, `confidenceScore: 0`, `data: null` (no live Geyser pipeline)
- [x] **EvidenceEngine** — `confidencePercent` from fixed documented map only (confirmed→100, candidate→50, unknown→0)
- [x] **AgentRouter** — deterministic dispatch by explicit `AgentIntent` enum; exhaustiveness check (`const _exhaustive: never = intent`)

### Code Quality
- [x] **No private keys / seed phrases** in codebase (grep confirmed)
- [x] **apps/api/src/solana.ts deleted** — empty leftover, confirmed not imported anywhere
- [x] **Correct entry point** — `src/main.ts` / `dist/main.js` (was `src/index.ts` / `dist/index.js`)
- [x] **Import path `.js` extensions** — all non-test, non-MCP relative imports use `.js` (NodeNext)
- [x] **tsconfig excludes** — `**/*.test.ts` and `src/mcp/**/*` excluded from build
- [x] **TS2589 in MCP** — documented (deep type instantiation from `McpServer.registerTool` generics); `npm run mcp` unaffected (tsx), no automated type-check for that directory

### CI / Workflow
- [x] **`.github/workflows/ci.yml`** — `npm install`, `npm audit` (continue-on-error), `lint`, `type-check`, `test`, `build` on every push/PR
- [x] **Dependabot** — weekly npm + GitHub Actions updates
- [x] **Empty `.github/workflows/main.yml` deleted** (was 1-byte file)

### Docs
- [x] **`docs/architecture.html`** — full pipeline diagram, correct 16-endpoint list, dual-theme, responsive
- [x] **`docs/index.html`** — GitHub links updated to correct repo (`--x`)
- [x] **`docs/proposal.html`** — test count banner updated (133→151+), links to real repo
- [x] **`README.md`** — CI badge URL updated to correct repo

---

## ⚠️ UNVERIFIED (cannot confirm without live external access)

### Solana RPC / Live WebSocket
- [ ] **`SolanaRpcClient.subscribeToLogs()`** — `onLogs` WebSocket subscription: Solana RPC was blocked in development sandbox. `LiveAlertWatcher` integration with a real RPC node is **unexercised**. Many public/free endpoints restrict WebSocket log subscriptions — a dedicated RPC provider is needed in production.
- [ ] **`TransactionRetriever.getWalletTransactionsMeta()`** — real RPC call shapes verified against `@solana/web3.js` type definitions, but never exercised against mainnet-beta
- [ ] **`SolanaRpcClient.getParsedTokenAccountsByOwner()`** — same caveat

### ChainGPT
- [ ] **Live API key response** — REST contract confirmed from official docs curl examples; multi-shape parser written defensively. Never tested with a real `CHAINGPT_API_KEY` from a reachable environment.
- [ ] **15-second timeout** — AbortController created correctly in code; timeout behavior tested with a mocked AbortError but the actual clock-based firing is untested.

### Dashboard (Next.js)
- [ ] **`npm install` in `dashboard/`** — npm registry unreachable in sandbox; build not verified locally. CI does not build the dashboard (`ci.yml` only covers `src/`).
- [ ] **`FACTLEDGER_API_URL` wiring** — `dashboard/lib/factledger-api.ts` reads env var and uses it; confirmed server-side only (no `NEXT_PUBLIC_` prefix). Not tested against a running API.
- [ ] **`FACTLEDGER_API_KEY`** — confirmed not in browser bundle by code inspection; actual auth round-trip unverified.
- [ ] **Vercel deployment** — `dashboard/README.md` documents the steps; not executed in this session.

### MCP Server
- [ ] **End-to-end with MCP client** — import paths verified against real SDK; tool registrations untested against a real MCP client
- [ ] **`npm run mcp`** — tsx transpiles directly; not run in this session (sandbox constraints)

### npm audit
- [ ] **Known remaining advisories** (moderate, no safe fix):
  - `@solana/web3.js` → `jayson` → `uuid` (moderate, transitive)
  - `vitest` → `esbuild` (moderate, dev-server-only)
  - Both documented in `ci.yml` `npm audit` step with `continue-on-error: true`

---

## 💡 OPTIONAL / FUTURE WORK

- [ ] **DEX amount extraction** — `RaydiumSwapDecoder`/`JupiterSwapDecoder` verify instruction type only; `inputMint`/`outputMint`/amounts left `null`. Filling these in requires verified account-layout specs from each protocol.
- [ ] **`unusual_volume` / `large_swap` / `new_token_interaction` alerts** — AlertEngine never fires these; they need real swap amount data (above)
- [ ] **MarketEventAgent** — always UNKNOWN; would need a Geyser/WebSocket event pipeline
- [ ] **Dashboard CI** — add a `dashboard/` build step to `ci.yml` once npm registry is accessible in CI
- [ ] **MCP type-check** — TS2589 blocks `tsc` for `src/mcp/`; could be worked around by splitting tool registrations or using `// @ts-ignore` selectively (currently excluded from build entirely)
- [ ] **Reconnect logic for LiveAlertWatcher** — current implementation does not auto-reconnect on WebSocket drop; suitable for short-lived subscriptions but not production-grade long-running monitoring
- [ ] **Price history endpoint** — `CoinGeckoPriceProvider` returns `null` for historical timestamps on the free tier; a paid tier or alternative provider would unlock `/wallet/:address/transactions/:sig` price data
- [ ] **`StubPriceProvider`** — suitable for dev/test only; production should use `CoinGeckoPriceProvider` or a paid equivalent
