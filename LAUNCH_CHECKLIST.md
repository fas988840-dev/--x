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
- [x] Accidental 1-byte `.github/workflows/main.yml` removed instead of adding a duplicate Dashboard workflow
- [x] Stale repo links corrected in current docs
- [x] Architecture document present with the current 16-endpoint map
- [x] Central logging boundary added for main/MCP/transaction-retrieval paths

### Automated verification — current head
- [x] CI run #180 passed
- [x] CodeQL Advanced run #36 passed
- [x] 173 tests passed / 0 failed (17 test files)
- [x] Type-check passed
- [x] Root build passed
- [x] Dashboard `npm ci` + build passed
- [x] Lint: 0 errors / 4 warnings (all four are `no-console` style warnings in `src/api/server.ts`)

---

## ⚠️ SECURITY STATUS — CLASSIFIED

The full dependency audit reports **8 findings total: 5 moderate, 1 high, 2 critical**. The production-only audit (`npm audit --omit=dev`) reports **3 moderate, 0 high, 0 critical**.

- [x] High/critical findings classified: they are in development tooling (`vitest`, `@vitest/ui`, `vite`) and are not production runtime dependencies.
- [x] Production/runtime findings classified: `@solana/web3.js` → `jayson` → `uuid`, currently reported as 3 moderate findings.
- [x] Critical dev advisory identified: `GHSA-5xrq-8626-4rwp` in Vitest UI-related tooling.
- [x] High dev advisory identified: `GHSA-fx2h-pf6j-xcff` in Vite.
- [x] Runtime UUID advisory identified: `GHSA-w5hq-g745-h8pq`.
- [x] No `npm audit fix --force` used. npm's proposed fixes require breaking/major dependency changes and are not accepted blindly.
- [ ] Controlled dev-tool upgrade (Vitest/Vite/UI) can be evaluated separately with full regression testing; it is not a production high/critical exposure.
- [ ] Runtime Solana/uuid transitive chain should be revisited when a safe compatible upstream fix is available.

---

## ⚠️ UNVERIFIED — requires live credentials or external infrastructure

These are verification gaps, not missing MVP code.

### Solana RPC / WebSocket
- [ ] `SolanaRpcClient.subscribeToLogs()` against a production/mainnet RPC WebSocket endpoint
- [ ] `TransactionRetriever.getWalletTransactionsMeta()` against mainnet-beta in the target production environment
- [ ] `getParsedTokenAccountsByOwner()` against mainnet-beta in the target production environment
- [ ] Long-running WebSocket reconnect behavior with the chosen production RPC provider

### ChainGPT live service
- [ ] Real request with a valid `CHAINGPT_API_KEY`
- [ ] Actual 15-second clock-triggered timeout in a reachable environment

### Dashboard / deployment
- [x] Dashboard CI install/build
- [ ] Dashboard connected to the deployed API with production `FACTLEDGER_API_URL`
- [ ] Auth round-trip using server-side `FACTLEDGER_API_KEY`
- [ ] Actual Vercel deployment verified with Root Directory set to `dashboard`
- [ ] External browser verification of the deployed dashboard URL

### MCP
- [ ] End-to-end run with a real MCP client
- [ ] Production-style `npm run mcp` smoke test in a reachable environment

### Funding / demo proof
- [ ] Public live dashboard/demo URL verified
- [x] Current architecture document present in repo
- [ ] 2–3 minute product walkthrough video recorded/published
- [x] Grant/funding narrative materials exist in `GRANTS/`; claims must remain evidence-based
- [ ] Actual Colosseum submission status recorded after submission

---

## 💡 OPTIONAL / FUTURE WORK

- [ ] Verified Raydium/Jupiter amount extraction from protocol layouts; keep current decoders candidate-only until layouts are independently verified
- [ ] `unusual_volume`, `large_swap`, and `new_token_interaction` alerts after real swap amounts exist
- [ ] General MarketEvent/Geyser pipeline
- [ ] Robust WebSocket reconnect/backoff for long-running alert monitoring
- [ ] Historical price provider beyond current free-tier limitations
- [ ] Replace StubPriceProvider in production configuration where live price data is required
