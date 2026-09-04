# FactLedger — One-Page Market Brief

## What it is

FactLedger is the evidence and risk intelligence layer for Solana. It converts wallet and transaction activity into attributable evidence, explainable risk, and machine-readable outputs for applications, analysts, compliance/forensics workflows, and AI agents.

## Why it matters

Raw chain data is abundant; trustworthy interpretation is scarce. Risk systems are often opaque, fragmented, or difficult to integrate. FactLedger is designed to return not only a score, but the evidence and context behind it while preserving UNKNOWN when data is unavailable.

## Product

Core pipeline:

**Solana RPC → Wallet Analyzer → Transaction Parser → Evidence Engine → Risk Engine → AI Agents / ChainGPT → API / Dashboard**

Key characteristics:
- read-only by default
- API-first and agent-friendly
- explainable evidence and risk outputs
- deterministic fallback when external AI is unavailable
- production-oriented test/build/documentation discipline

## Target users

- Solana wallets and explorers
- compliance, investigation and forensics teams
- trading and risk platforms
- protocols that need wallet/transaction context
- AI/agent builders that need structured blockchain intelligence

## Business model

API-first SaaS:
- Developer
- Pro
- Business
- Enterprise

Pricing and packaging will be validated with real users before long-term commitments.

## Defensibility

FactLedger's long-term value is expected to come from more than code:
- versioned Evidence/Risk Graph with provenance
- accumulated historical intelligence from legitimate product usage
- external integrations and repeat workflows
- operating reliability and explainability
- distribution through API, agents and ecosystem relationships

## Current status

Built:
- Solana analysis pipeline
- Wallet Analyzer
- Transaction Parser
- Evidence Engine
- Risk Engine
- AI Agents
- ChainGPT integration with deterministic fallback
- API, documentation, automated tests and dashboard
- Render service deployment

Still requiring live proof before stronger claims:
- public Vercel dashboard deployment
- Dashboard → API production round trip
- externally verified API health
- production Solana RPC/WebSocket behavior
- real-key ChainGPT request
- customer/design-partner traction

## Near-term objective

Close production verification, publish a concise live demo, recruit 5–10 design partners, and use observed demand to prioritize integrations and monetization.

## Positioning line

**Evidence you can inspect. Risk your software can use. Built for Solana.**
