# FactLedger — Colosseum Eternal Application Draft

> Draft only. Verify current Colosseum eligibility and deal terms immediately before submission. Never claim metrics or live behavior that are not evidenced.

## One-line pitch

FactLedger is the evidence and risk intelligence layer for Solana: it turns wallet and transaction activity into attributable evidence, explainable risk, and machine-readable outputs for apps, analysts, and AI agents.

## Problem

Wallet and transaction risk is often delivered as a black-box label or fragmented raw-chain data. Developers and analysts need outputs that explain *why* something is risky, cite the evidence behind the assessment, preserve uncertainty when data is unavailable, and can be consumed programmatically.

## Solution

FactLedger provides a read-only Solana intelligence pipeline:

Solana RPC → Wallet Analyzer → Transaction Parser → Evidence Engine → Risk Engine → AI Agents / ChainGPT → API / Dashboard.

Outputs are designed for both humans and software: structured evidence, risk context, explanations, and deterministic fallback behavior when external AI services are unavailable.

## Why now

Solana application and agent activity creates demand for machine-readable, explainable risk context. FactLedger is positioned as infrastructure rather than a single consumer dashboard, allowing wallets, protocols, investigators, trading/risk platforms, and agent builders to integrate the same evidence layer.

## What is built

- Solana RPC integration
- Wallet Analyzer
- Transaction Parser
- Evidence Engine
- Risk Engine
- AI Agents
- ChainGPT integration with deterministic fallback
- production API code and documentation
- automated tests/type-check/build pipeline
- dashboard code
- Render deployment

## What the sprint should prove

1. Public production dashboard + API end-to-end.
2. External Solana mainnet verification.
3. A polished 90–180 second demo.
4. First design-partner conversations and at least one external integration target.
5. Evidence/Risk Graph schema for durable intelligence history.

## Weekly update template

### Week 1
- Production deployment status
- public demo progress
- measurable reliability improvements
- blockers and exact next step

### Week 2
- first external user/design-partner feedback
- onboarding/API improvements
- evidence quality improvements

### Week 3
- integration or workflow validated with a real external use case
- Evidence/Risk Graph progress
- initial pricing/willingness-to-pay findings if available

### Week 4
- final live demo
- verified traction metrics only
- roadmap and use of capital

## Defensibility

The long-term moat is not just source code. It is the combination of:
- accumulated, versioned evidence/risk history with provenance
- Solana-specific integrations and operating knowledge
- API/agent distribution
- customer workflows and repeat usage
- explainability and reproducibility

## Business model

API-first SaaS with self-service developer usage, higher-volume professional/business tiers, and negotiated enterprise plans. Pricing remains subject to market validation before hard commitments.

## Use of capital

Priority order:
1. production reliability and RPC infrastructure
2. evidence/provenance quality
3. design-partner onboarding and integrations
4. developer experience and public examples
5. security and operational hardening

## Current Colosseum program facts to re-check before submission

Colosseum Eternal currently describes a four-week product sprint with one-minute weekly update videos. Eligible submissions can compete for a $25,000 USDC non-dilutive semi-annual Eternal Award. Standout startups may also be considered for Colosseum's accelerator; the accelerator currently describes $250,000 pre-seed investment under its standard deal and an eight-week hybrid program.

Official sources:
- https://colosseum.com/eternal
- https://colosseum.com/accelerator
