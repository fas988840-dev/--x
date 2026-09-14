# FactLedger — Audited Web3 Grant Matrix & Submission Pack

Updated: 2026-09-14

This file replaces unverified grant-guide claims with current, evidence-based positioning. It does **not** treat a draft, email, eligibility screen, or account creation as a submitted or approved grant.

## Canonical project facts

- Project: **FactLedger**
- Founder: Abdullah Al-Anzi
- Location: Riyadh, Saudi Arabia
- Stage: MVP / early prototype
- Company status: independent project / no registered company documented
- Open source: MIT
- GitHub: https://github.com/fas988840-dev/--x
- Live API: https://factledger-api.onrender.com
- Demo: https://factledger-demo.onrender.com/demo.html
- Solana wallet: `EWEY53t7rXLTQ964EhuAXHAMV9WoEkxn4h4fYB1ZRFNM`

## Priority order for FactLedger

### 1) Solana Foundation — TOP FIT

Current official positioning: milestone-based grants for public goods, convertible grants where there is a commercial component, and RFPs. Applications are rolling. The Foundation asks for a project overview, public-good value, a structured budget, and measurable milestones. The official page does **not** state a universal $10k-$400k range and does **not** state that a 10-12 slide pitch deck is mandatory for every application.

**Current FactLedger status:** already submitted previously. Do not file another duplicate application unless Solana asks for a revision or a materially different proposal.

**Recommended ask if Solana requests a revised phase:** $25,000 milestone-based public-good grant.

Proposed milestones:

1. $6,000 — production RPC/WebSocket reliability, provider benchmarking, failover validation, monitoring.
2. $7,000 — wallet intelligence, transaction parsing, deterministic risk and evidence coverage.
3. $5,000 — security hardening, automated tests, CI and reproducible verification artifacts.
4. $4,000 — API docs, examples, integration guides, public demo UX.
5. $3,000 — release hardening, observability and public verification report.

### 2) Helius Startup Launchpad — STRONG FIT, NOT A CASH GRANT

Official Helius benefits include 8 free months of the Business plan, investor introductions, mentorship and partner discounts. Helius says it is looking for teams with **some combination** of: working product, pre-Series-A stage, accelerator background, investor referral, or Solana hackathon placement.

**FactLedger fit:** working Solana product and pre-Series-A stage are true. Do not claim hackathon placement, accelerator graduation or VC referral unless proven.

**Application copy:**

> FactLedger is a live, open-source, read-only Solana wallet intelligence API built around reproducibility. It converts public on-chain activity into deterministic wallet intelligence, risk analysis and transaction-cited evidence, and returns null/UNKNOWN instead of inventing unavailable data. The product is deployed, MIT licensed, and currently founder-led. Helius infrastructure would directly support higher-reliability RPC/WebSocket access, production monitoring and the next stage of verified transaction intelligence.

### 3) Superteam — APPLY ONLY TO GLOBAL / SAUDI-ELIGIBLE LISTINGS

Superteam operates bounties, projects and Instagrants across the Solana ecosystem. Eligibility varies by listing and region.

**Correction:** do not apply through an Africa-only route or claim Africa eligibility. Founder location is Saudi Arabia. Apply only to Global or Saudi-eligible opportunities.

**General application copy:**

> FactLedger is an open-source Solana developer tool for auditable wallet intelligence. It provides deterministic wallet and risk analysis with exact transaction evidence, explicit confidence states and null/UNKNOWN behavior for unverified data. Funding would be used to harden RPC/WebSocket reliability, expand verified transaction evidence coverage, publish integration examples and obtain measurable external developer usage.

### 4) ChainGPT Web3 AI Grant — GOOD FIT AFTER LIVE KEY ACTIVATION

Current ChainGPT program materials describe up to $20,000 in API credits and up to $10,000 USDC for individual projects depending on tier and stage.

**Current FactLedger gate:** ChainGPT must remain an explanation layer only. A real founder-created `CHAINGPT_API_KEY` must be added to production and verified with a genuine live request before FactLedger claims an active production AI integration.

**Do not duplicate an existing ChainGPT submission without checking its current status.**

### 5) Solo Grants — POSSIBLE MICROGRANT

Solo Grants currently advertises $100-$1,000 microgrants for solo builders where a small amount for parts, compute or materials closes the gap to a working version.

FactLedger already has a working MVP, so the request should be narrow and concrete rather than framed as seed funding.

**Recommended request: $1,000 for production verification costs**

> I am a solo founder building FactLedger, an open-source Solana wallet intelligence API. The product is already live, and the next bottleneck is a small, concrete production-verification budget: dedicated RPC usage, monitoring and reproducible network validation. I am requesting $1,000 strictly for infrastructure and verification costs that move the MVP from free-tier testing toward a measurable production benchmark.

### 6) Gitcoin — NOT A PRIMARY FIT RIGHT NOW

Gitcoin 3.0 is currently recentered on Ethereum funding and coordination. FactLedger is Solana-only today. Do not present it as Ethereum public infrastructure until actual Ethereum support exists.

### 7) Microsoft for Startups — CURRENT COMPANY-STATUS BLOCKER

Current Microsoft eligibility says the applicant must be a privately held, for-profit company, headquartered where Azure is available, and own the software product/service. Benefits can scale up to $150,000 in credits over time based on verified progress and Azure usage.

**Current blocker:** no registered company is documented for FactLedger. Do not claim incorporation. If the application requires company verification, pause until a legal entity exists.

### 8) Google for Startups Cloud — CREDITS, NOT CASH

Current Google Cloud startup program advertises $2,000 for MVP-stage startups, up to $200,000 for eligible Seed-Series A startups, and up to $350,000 for eligible AI-first startups.

Apply only if the founder/company route is actually eligible. Do not claim AI-first merely because FactLedger has an optional explanation layer.

### 9) AWS Activate — CREDITS, NOT CASH

AWS credits require an AWS account and may require a payment method. Exact Activate eligibility depends on the offer/path. Treat AWS as infrastructure support, not a cash grant.

### 10) Other-chain ecosystem grants — WAIT UNTIL REAL SUPPORT EXISTS

Ethereum, Base, Arbitrum, Optimism, Polygon, Avalanche, Starknet, Sui, Aptos, BNB Chain, Cosmos, Polkadot, Stellar, Mantle, TON, Moonbeam, Celo, Rootstock, IOTA, Aleph Zero, peaq, XRPL and similar programs should **not** receive a FactLedger application while the product is Solana-only.

A future application is appropriate only after FactLedger ships genuine support for that chain and can show tests, live endpoints and evidence semantics for it.

## Grant-ready project answer

### Short description

> FactLedger is a read-only Solana wallet intelligence API whose outputs can be independently checked. It converts public on-chain activity into deterministic wallet intelligence, risk analysis and transaction-cited evidence. Unknown or unverified values are returned as null/UNKNOWN rather than guessed.

### Why Solana

> FactLedger is built around Solana's high-throughput public transaction history and developer ecosystem. The product analyzes Solana wallet behavior, token activity and transaction evidence directly from Solana RPC data, and its current protocol coverage, evidence model and developer API are Solana-specific.

### Public-good value

> The open-source MIT core gives developers a transparent alternative to opaque wallet scores. Every supported finding is tied to observable transaction evidence, while unsupported or unavailable facts remain explicit unknowns. This makes the system useful for developer tooling, agents, security research and audit-oriented workflows.

### Why this team

> FactLedger is currently founder-led and built by a solo developer who has already designed, deployed and maintained the live product end-to-end: the Solana data pipeline, deterministic scoring and risk logic, evidence engine, REST/MCP interfaces, CI, deployment and verification tooling. The grant would accelerate a working public project rather than fund an idea from scratch.

## Current technical blockers that cannot be truthfully papered over

1. Real founder-controlled Pyth credentials and feed verification are still required before calling Pyth production-active.
2. Real founder-controlled ChainGPT credentials and a genuine live API response are required before calling ChainGPT production-active.
3. Raydium/Jupiter remain candidate-level for amount/mint extraction until account/instruction layouts are independently verified.
4. Live alert logic exists but still needs production RPC/WebSocket validation.
5. External usage proof is still needed; do not claim users, customers, MAU, revenue or adoption without evidence.
6. Legal entity / KYC / payment / tax / signature / binding investment terms remain founder-controlled actions.

## Submission rules

- Do not submit duplicate Solana Foundation applications while an existing application is active.
- Do not reuse the same funded expense across multiple grants if any award is received.
- Do not claim a registered company unless one exists.
- Do not claim grants, credits, awards, customers, revenue or investors without documentary proof.
- Do not submit chain-specific grants for chains FactLedger does not actually support.
- Final portal submissions involving account login, KYC, legal attestations, tax terms, signatures, wallet signatures or binding investment terms must be completed by the founder.
