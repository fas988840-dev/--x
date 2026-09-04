# FactLedger — Growth, Funding & Exit Execution Plan

## Positioning

**FactLedger is the evidence and risk intelligence layer for Solana.**

The product should not be marketed as another wallet dashboard. Its durable value is the combination of transaction intelligence, attributable evidence, risk scoring, agent/API access, and a proprietary intelligence history that becomes more useful as usage grows.

## North-star value stack

1. **Production SaaS** — reliable hosted API and dashboard.
2. **Evidence/Risk Graph** — Wallet ↔ Transaction ↔ Token ↔ Program ↔ Counterparty ↔ Evidence ↔ Risk Event.
3. **Proprietary historical intelligence** — versioned evidence and risk observations accumulated through legitimate product usage, with provenance and retention controls.
4. **Distribution** — design partners, API integrations, agents, ecosystem relationships, and repeat users.
5. **Recurring revenue** — paid API tiers and enterprise contracts.
6. **Defensibility** — reproducible evidence, explainability, integration depth, operational reliability, brand, and commercial know-how.

## Execution gates

### Gate A — Production proof (NOW)

Do not add broad feature scope until this gate is green.

- [x] Core Solana analysis pipeline implemented.
- [x] Wallet Analyzer implemented.
- [x] Transaction Parser implemented.
- [x] Evidence Engine implemented.
- [x] Risk Engine implemented.
- [x] AI Agents implemented.
- [x] ChainGPT integration with deterministic fallback implemented.
- [x] API, documentation, tests, type-check and builds established.
- [x] Render service deployed.
- [ ] Verify Render `/api/v1/health` externally.
- [ ] Add `VERCEL_TOKEN` to GitHub Actions secrets and complete production dashboard deploy.
- [ ] Configure production `FACTLEDGER_API_URL` and server-side API authentication without exposing secrets.
- [ ] Verify production CORS and Dashboard → API round trip.
- [ ] Verify Solana mainnet RPC/WebSocket behavior and reconnect path.
- [ ] Verify one real ChainGPT request when a legitimate key is configured; retain deterministic fallback.

**Exit criterion:** a third party can open the public product and complete a documented end-to-end demo.

### Gate B — Market validation

Target 5–10 design partners before major integrations.

Ideal segments:
- Solana wallets and explorers
- compliance / investigations / forensics teams
- trading and risk platforms
- protocols that need wallet or transaction risk context
- agent builders that need machine-readable evidence

Track weekly:
- active API integrations
- successful analyses / API requests
- weekly active users
- pilot organizations
- time-to-first-result
- repeat usage
- top requested capabilities

Do **not** implement Pyth, Orca, Magic Eden or other integrations merely for logo count. Promote an integration when a design partner, evidence-quality requirement, or revenue case justifies it.

### Gate C — Moat

Build the Evidence/Risk Graph from product events with explicit provenance. Preserve UNKNOWN when data is unavailable; never manufacture certainty.

Minimum graph model:
- entity identifier and type
- observation timestamp
- source/provenance
- evidence claim and confidence
- relationship to wallet/transaction/token/program/counterparty
- risk event and score version
- model/ruleset version
- expiry/revalidation metadata where appropriate

Use historical data only in ways consistent with applicable privacy, contractual, licensing, and chain-data requirements.

### Gate D — Revenue

Commercialize the existing API before building unrelated products.

Candidate packaging to validate with customers:
- Developer: limited usage, self-service
- Pro: higher limits, alerts/history, priority processing
- Business: team/API usage, service expectations
- Enterprise: negotiated volume, support, deployment/security requirements

Pricing is a market-validation exercise, not a code constant. Measure willingness to pay before locking annual plans.

Revenue KPIs:
- MRR / ARR
- paying organizations
- ARPA
- gross margin
- retention / expansion
- API usage per paying account
- sales-cycle duration

### Gate E — Grants & financing

Run non-dilutive and equity paths in parallel once Gate A has credible proof.

Funding package:
- live product URL
- 90–180 second demo
- one-page company/product brief
- architecture and security summary
- milestone roadmap and use-of-funds
- traction dashboard
- founder/team information supplied by the owner
- grant-specific public-good/ecosystem impact statement

Targets should be verified against current official program terms before submission. Never claim acceptance, traction, customers, revenue, partnerships, or live integrations that are not evidenced.

For investment, maintain a financing model covering runway, dilution, milestones, and downside cases. Legal counsel should review SAFE/equity/token rights before signature.

### Gate F — Strategic acquisition readiness

Be acquisition-ready without advertising distress or forcing a sale.

Maintain a buyer data room containing:
- corporate/IP ownership records supplied by the owner
- architecture and technical diligence pack
- dependency/security register
- customer/pilot contracts and pipeline
- cohort/usage/revenue metrics
- grant/investment agreements
- operating costs and vendor commitments
- product roadmap
- material licenses and third-party terms

Potential buyer thesis: acquiring FactLedger should be faster and strategically stronger than reproducing its evidence history, integrations, customer distribution and operating knowledge.

Evaluate offers on total economics, not headline price:
- cash at close
- rollover/equity
- earn-out probability and conditions
- escrow/holdback
- IP transferred
- employment/consulting obligations
- exclusivity/non-compete restrictions
- tax/legal consequences

## 90-day operating plan

### Days 0–7 — Production + proof
Close Gate A. Produce a stable public demo and verification record.

### Days 7–21 — Distribution
Recruit first design partners, publish concise technical examples, and make API/MCP onboarding low-friction. Capture every recurring objection and request.

### Days 14–30 — Funding package
Prepare grant submissions and investor materials using only verified claims. Start non-dilutive applications first where strategically appropriate.

### Days 21–60 — Moat + first monetization
Implement the highest-value evidence/integration requests, start Evidence/Risk Graph persistence, validate pricing, and convert qualified pilots toward paid usage.

### Days 45–90 — Scale decision
Choose the next capital strategy from evidence:
- bootstrap if revenue growth funds the roadmap;
- grant-funded expansion if non-dilutive capital covers milestones;
- pre-seed if capital materially accelerates distribution/moat;
- strategic process only if buyer interest supports a premium outcome.

## Product principles

- Read-only Solana behavior by default.
- Preserve NodeNext and explicit `.js` ESM imports.
- Preserve ChainGPT deterministic fallback.
- Preserve candidate DEX status and UNKNOWN behavior when data is unavailable.
- Evidence must be attributable and reproducible where possible.
- No fabricated live-test results, customers, revenue, partnerships, or funding status.
- No secrets in source control, docs, screenshots, issues, or application materials.
- Avoid forced dependency upgrades solely to silence audit output; remediate with controlled testing.
- New features must improve reliability, evidence quality, distribution, revenue, or defensibility.

## Decision rule

Every material task should answer at least one question:

1. Does it make production more trustworthy?
2. Does it create proprietary evidence/intelligence?
3. Does it acquire or retain users?
4. Does it create revenue?
5. Does it increase financing or acquisition leverage?

If the answer to all five is no, defer it.
