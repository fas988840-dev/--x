# FactLedger — Solana Foundation Funding Draft

> Draft only. Verify current official terms immediately before submission. Do not claim live usage, customers, partnerships, revenue, or integrations that are not evidenced.

## Project overview

FactLedger is an evidence and risk intelligence layer for Solana wallets and transactions. It combines transaction parsing, wallet behavior analysis, attributable evidence, risk scoring, explainable outputs, and machine-readable API/agent access.

The goal is to help developers, analysts, investigators, wallets, protocols, and agent builders understand *why* an address or transaction is risky, not just receive an opaque score.

## Why Solana

FactLedger is designed around Solana's transaction model, account structure, program interactions, high-throughput activity, and ecosystem-specific risk signals. The product is read-only by default and is intended to improve visibility, explainability, and developer access to wallet/transaction intelligence within the Solana ecosystem.

## Public-good angle

A grant proposal should focus on the reusable ecosystem value rather than the commercial dashboard alone. Candidate public-good deliverables:

1. Open documentation for evidence provenance and risk-explanation conventions on Solana.
2. A free community-access tier for wallet/transaction evidence analysis.
3. Public examples and reference integrations for developers and agents.
4. Open schemas for machine-readable evidence/risk outputs where commercially feasible.
5. Reproducible benchmark/test fixtures using non-sensitive public-chain data.

Commercial features can remain separate where appropriate. If the project is judged primarily commercial, a convertible grant may be more suitable than a standard public-good grant.

## Proposed milestone structure

### Milestone 1 — Production verification
- Public API and dashboard live.
- Production health and end-to-end verification documented.
- Solana mainnet RPC behavior verified.
- Evidence/risk outputs remain attributable and preserve UNKNOWN when data is unavailable.

### Milestone 2 — Developer/public-good release
- Publish evidence/risk schema documentation.
- Release public API examples and agent/MCP examples.
- Publish benchmark fixtures and a reproducible demo flow.

### Milestone 3 — Ecosystem validation
- Recruit design partners from wallets, explorers, protocols, compliance/forensics, or agent builders.
- Publish anonymized/aggregated lessons learned where permitted.
- Deliver integration improvements driven by demonstrated ecosystem need.

## Suggested use of funds

Final numbers should be tied to the exact amount requested. A reasonable budget framework:

- Production infrastructure and RPC reliability
- Engineering for provenance/evidence quality
- Developer documentation and reference integrations
- Security/dependency remediation and monitoring
- Ecosystem onboarding and public developer support

Avoid allocating grant funds to unrelated feature expansion.

## Success metrics

Use only verified source-of-truth data:

- successful analyses / API requests
- active external integrations
- repeat users
- public API/documentation usage
- number of design partners
- evidence quality / reproducibility metrics
- uptime and error-rate metrics

## Current readiness

Implemented:
- Solana RPC integration layer
- Wallet Analyzer
- Transaction Parser
- Evidence Engine
- Risk Engine
- AI Agents
- ChainGPT integration with deterministic fallback
- API, documentation, tests and dashboard code
- Render service deployment

Still to verify before submission claims are upgraded:
- public dashboard production deployment
- external API health round trip
- production Solana mainnet/WebSocket verification
- real-key ChainGPT request
- external design-partner usage

## Official program notes to re-check before filing

Solana Foundation currently describes milestone-based grants for public goods, convertible grants for public goods with a commercial component, and RFPs. It asks applicants to explain the public good, why the project is specific to Solana, and provide a structured budget with measurable milestones.

Official source: https://solana.org/grants-funding
