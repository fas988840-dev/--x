# FactLedger Launch Checklist

Generated: 2026-09-02  
Branch: `claude/claude-md-docs-zdlvr9`

---

## ✅ VERIFIED (automated test, CI, or direct code inspection)

### Core pipeline
- [x] BehaviorAnalyzer: empty input, failure-rate math, unique program/token counts
- [x] IntelligenceScorer: score range [0,100], four components, deterministic output, empty input → 0
- [x] RiskAssessor: score range [0,100], valid level/reasoning/factors, higher failure rate increases risk
- [x] AlertEngine: expected alert triggering, valid severity, non-empty evidence
- [x] Full deterministic integration chain: BehaviorAnalyzer → IntelligenceScorer → RiskAssessor → AlertEngine
- [x] No fabricated price/LLM values: unavailable data remains null/UNKNOWN/fallback as documented
- [x] Amounts/fees preserved as strings where precision matters

### HTTP API and security controls
- [x] ValidationError → HTTP 400 through centralized error handling
- [x] Async handlers forward rejected promises to centralized error handling
- [x] Helmet security headers
- [x] CORS exact-origin allowlist, GET/OPTIONS only, credentials disabled
- [x] General and RPC-heavy rate limits
- [x] Optional API-key authentication through `API_KEYS`; health/index exempt
- [x] No-store/no-cache response headers
- [x] Intelligence/risk responses include disclaimer fields
- [x] No private keys, seed phrases, transaction signing, or write-to-chain operations in the application path

### ChainGPT
- [x] No-key short-circuit
- [x] HTTP/network/AbortError handling
- [x] Defensive multi-shape response parsing
- [x] Deterministic explanation fallback when ChainGPT is unavailable
- [x] Request path remains ChainGPT; no replacement with another LLM provider

### LiveAlertWatcher
- [x] Address validation
- [x] Immediate evaluation
- [x] Evidence-based deduplication
- [x] Unsubscribe on stop
- [x] In-flight stop suppression
- [x] Transient RPC-error handling
- [x] onLogs callback re-evaluation covered by tests

### Agents / MCP honesty
- [x] Wallet/Risk agents expose evidence status and confidence consistently
- [x] MarketEventAgent stays UNKNOWN with null data because no live market/Geyser event pipeline exists
- [x] Evidence confidence map remains confirmed→100, candidate→50, unknown→0
- [x] MCP tool descriptions do not convert UNKNOWN into fabricated facts

### Code quality / cleanup
- [x] Correct NodeNext `.js` relative imports preserved for compiled ESM
- [x] `src/main.ts` / `dist/main.js` entry point preserved
- [x] Empty `apps/api/src/solana.ts` removed after reference check
- [x] Empty `.github/workflows/main.yml` removed
- [x] Stale repo links corrected in current docs
- [x] Architecture document present with the current 16-endpoint map

### Automated verification
- [x] Root CI installs dependencies, runs audit, lint, type-check, tests, and build
- [x] 173 tests passed / 0 failed on the latest reviewed pre-hardening run
- [x] Type-check passed on the latest reviewed pre-hardening run
- [x] Root build passed on the latest reviewed pre-hardening run
- [x] CodeQL passed on the latest reviewed pre-hardening run
- [x] Dashboard install/build has now been added as a separate CI job; final status must be taken from the workflow triggered by this commit

---

## ⚠️ SECURITY STATUS — OPEN AND EXPLICIT

The latest reviewed root `npm audit` reported **8 vulnerabilities total: 5 moderate, 1 high, 2 critical**.

- [ ] Do not describe the remaining audit findings as “moderate only”.
- [ ] Do not use `npm audit fix --force`; the suggested fixes may involve breaking major-version changes.
- [ ] The CI audit step is deliberately non-blocking so lint/tests/build still execute and produce evidence. A green CI run therefore does **not** mean npm audit is clean.
- [ ] Before production launch, classify each high/critical advisory as runtime vs dev/transitive and remediate safely or document the accepted risk with package/advisory IDs.

---

## ⚠️ UNVERIFIED — requires live credentials or external infrastructure

### Solana RPC / WebSocket
- [ ] `SolanaRpcClient.subscribeToLogs()` against a production/mainnet RPC WebSocket endpoint
- [ ] `TransactionRetriever.getWalletTransactionsMeta()` against mainnet-beta
- [ ] `getParsedTokenAccountsByOwner()` against mainnet-beta
- [ ] Long-running WebSocket reconnect behavior with the chosen production RPC provider

### ChainGPT live service
- [ ] Real request with a valid `CHAINGPT_API_KEY`
- [ ] Actual 15-second clock-triggered timeout in a reachable environment

### Dashboard / deployment
- [ ] Final result of the new dashboard CI build job
- [ ] Dashboard connected to a running API with `FACTLEDGER_API_URL`
- [ ] Auth round-trip using server-side `FACTLEDGER_API_KEY`
- [ ] Actual Vercel deployment with Root Directory set to `dashboard`
- [ ] External browser verification of the deployed URL

### MCP
- [ ] End-to-end run with a real MCP client
- [ ] Production-style `npm run mcp` smoke test in a reachable environment

### Funding / demo proof
- [ ] Public live demo URL
- [ ] Current architecture link/screenshots
- [ ] 2–3 minute product walkthrough video
- [ ] Final grant/funding narrative with verified claims only
- [ ] Actual Colosseum/grant submission status recorded after submission

---

## 💡 OPTIONAL / FUTURE WORK

- [ ] Verified Raydium/Jupiter amount extraction from protocol layouts; keep current decoders candidate-only until layouts are independently verified
- [ ] `unusual_volume`, `large_swap`, and `new_token_interaction` alerts after real swap amounts exist
- [ ] General MarketEvent/Geyser pipeline
- [ ] MCP full static type-check workaround for deep SDK generics
- [ ] Robust WebSocket reconnect/backoff for long-running alert monitoring
- [ ] Historical price provider beyond current free-tier limitations
- [ ] Replace StubPriceProvider in production configuration where live price data is required
