# FactLedger — Launch Pack

## Positioning

**FactLedger is the evidence and risk intelligence layer for Solana.**

A wallet or transaction enters the FactLedger pipeline and the system returns deterministic behavioral analysis, risk scoring, evidence/provenance, and a machine-readable result. Missing data remains UNKNOWN rather than being converted into fabricated certainty.

## Short launch announcement

FactLedger is a read-only Solana intelligence platform built for applications that need more than an opaque wallet score. It turns on-chain activity into deterministic behavior metrics, risk factors, evidence, provenance, and machine-readable outputs for APIs, dashboards, agents, and investigation workflows.

The current system includes transaction parsing, wallet behavior analysis, risk/intelligence scoring, ChainGPT-backed explanation with deterministic fallback, MCP tools, alerts, a dashboard, and an append-only Evidence/Risk Graph core. Production claims must be limited to capabilities that have been independently verified live.

## Builder/community version

Building on Solana usually means choosing between raw RPC data and black-box risk products. FactLedger is designed to sit between those layers: inspectable evidence, deterministic scoring, provenance, and explicit `confirmed` / `candidate` / `unknown` states.

We are looking for design partners building wallets, explorers, security/compliance tools, trading/risk systems, protocols, and AI agents that need wallet or transaction intelligence through an API.

## Design-partner CTA

A qualified design partner should bring a real workflow, production-like data, an integration owner, and willingness to provide structured feedback. The first pilots should optimize for repeat usage and evidence quality, not vanity signups.

## Demo narrative

1. Submit a Solana wallet.
2. Show raw observable activity and parsed transactions.
3. Show deterministic behavior metrics and intelligence score.
4. Show transparent risk factors and evidence.
5. Show provenance/confidence state and UNKNOWN behavior when data is unavailable.
6. Show ChainGPT explanation only as a rephrasing layer over already-computed facts.
7. Show API/MCP output suitable for software and agents.
8. Explain that the Evidence/Risk Graph is the historical intelligence layer; the current adapter is in-memory until durable production storage is implemented.

## 90-second video structure

- 0–15s: Problem — Solana apps need auditable wallet risk/evidence, not just opaque scores.
- 15–35s: Product — one FactLedger request produces behavior, risk, evidence, provenance, and machine-readable output.
- 35–60s: Demo — wallet search, risk/evidence result, API/MCP output.
- 60–75s: Defensibility — accumulating Evidence/Risk Graph and reproducible intelligence history.
- 75–90s: Ask — design partners, ecosystem grants, and investors aligned with Solana infrastructure/security.

## Messaging controls

Do not claim production uptime, paying customers, revenue, proprietary dataset scale, live ChainGPT behavior, live Vercel deployment, or integration coverage unless verified. Do not describe candidate DEX identification as confirmed decoding. Do not call in-memory graph storage a durable historical database.