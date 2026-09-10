# FactLedger — Colosseum Crypto World's Fair 2026 Submission Pack

Status: registration is complete; build/submission stage has not started yet. This file is the ready-to-paste submission pack for the current Colosseum hackathon shown in the founder dashboard. Do not confuse it with the separate Colosseum Eternal sprint.

## Product name

FactLedger

## One-line pitch

FactLedger is a read-only Solana wallet intelligence API that returns verifiable on-chain evidence instead of opaque or fabricated scores.

## Short description

FactLedger helps Solana developers analyze wallets with deterministic risk and intelligence signals backed by exact transaction evidence. Unknown or unverifiable values are returned as null rather than estimated. The project is open-source under MIT and includes a live API, public demo, REST endpoints, MCP tools, and verification tooling.

## Problem

Wallet intelligence increasingly influences protocol access, counterparty screening, compliance review, agent decisions, and security workflows. Existing tools often expose a score or conclusion without making the supporting transactions, assumptions, and missing data easy to audit. That makes downstream automation hard to trust.

## Solution

FactLedger uses a conservative evidence-first pipeline. It reads public Solana data, normalizes wallet and transaction facts, computes deterministic risk and intelligence signals, and returns the exact evidence used by the analysis. If a value cannot be verified, it remains null. The system is read-only: it does not request private keys, store seed phrases, sign transactions, or take custody.

## Why it matters for Solana

FactLedger is intended as developer infrastructure for teams building wallets, agents, dashboards, security tooling, compliance workflows, and protocol risk systems. The core idea is simple: important wallet-intelligence outputs should be independently checkable against on-chain data.

## What is already built

- Live production API
- Public demo
- Open-source MIT repository
- Wallet intelligence endpoints
- Deterministic wallet risk analysis
- Transaction-level evidence output
- Token security checks
- REST and MCP interfaces
- CI and deployment workflows
- RPC/WebSocket verification tooling

## Differentiation

FactLedger does not ask users to trust a black-box score. It is deliberately conservative: missing values are not guessed, candidate detections are not presented as confirmed, and evidence is exposed so results can be independently recomputed.

## Team

Abdullah Al-Anzi — solo founder and developer based in Riyadh, Saudi Arabia. FactLedger is currently an MVP / early prototype and is not represented as a registered company. No users, revenue, investment, prizes, awards, or partnerships should be claimed unless separately verified.

## Repository

https://github.com/fas988840-dev/--x

## Live API

https://factledger-api.onrender.com

## Health endpoint

https://factledger-api.onrender.com/api/v1/health

## Live demo

https://factledger-demo.onrender.com/demo.html

## X / Twitter

https://x.com/aamm123220

## Solana wallet

EWEY53t7rXLTQ964EhuAXHAMV9WoEkxn4h4fYB1ZRFNM

## Suggested category / tracks

Primary: Developer Tooling / Infrastructure
Secondary, only if the hackathon permits multiple tracks and the wording matches: Security, AI Agents / MCP, Data / Analytics

Do not choose DeFi merely because the project analyzes wallets; FactLedger itself is not a trading, lending, or liquidity protocol.

## 30-second pitch

FactLedger is a read-only Solana wallet intelligence API built for developers who need evidence, not just a score. It analyzes wallet activity, computes deterministic risk signals, and returns the exact transaction evidence behind the result. If data cannot be verified, FactLedger returns null instead of inventing a value. The product is live, open-source under MIT, and designed so developers and AI agents can independently audit what the API says.

## 60-second pitch video script

Hi, I’m Abdullah Al-Anzi, the solo founder of FactLedger.

FactLedger is a read-only Solana wallet intelligence API built around one rule: never fabricate data. Wallet analytics often return precise-looking scores without showing exactly which transactions produced them or which values were missing. That is risky when developers or AI agents automate decisions from those results.

FactLedger reads public Solana data, calculates deterministic wallet risk and intelligence signals, and returns transaction-level evidence behind the analysis. If a price, amount, or other field cannot be verified, it stays null instead of being estimated.

The MVP is already live, the repository is open-source under MIT, and the same evidence-first pipeline is available through REST and MCP interfaces. During this hackathon I’m focused on improving reliability, protocol coverage, verification tooling, and the developer experience.

The goal is simple: don’t trust the score — check it.

## Technical demo script

1. Open the FactLedger demo and show the live health status.
2. Enter a public Solana wallet address.
3. Run wallet intelligence and wallet risk.
4. Show the evidence output and point to transaction signatures / slots / programs returned by the API.
5. Explain that unknown values remain null rather than being guessed.
6. Show the GitHub repository and the read-only architecture.
7. Show REST / MCP capability for developer and agent integrations.
8. Close with: “Don’t trust the score — check it.”

## Hackathon build plan

### Phase 1 — Reliability
- Verify production RPC/WebSocket behavior.
- Improve provider failover and timeout handling where needed.
- Keep health reporting explicit and reproducible.

### Phase 2 — Evidence quality
- Expand wallet transaction evidence coverage.
- Tighten protocol/program verification rules.
- Keep candidate detections clearly separated from confirmed detections.

### Phase 3 — Developer experience
- Improve demo flow and endpoint documentation.
- Add concise integration examples.
- Make evidence output easier to inspect and independently reproduce.

### Phase 4 — Submission proof
- Capture a short live demo video.
- Record a clear pitch video.
- Link the repository, demo, and production API.
- State current limitations directly instead of overstating traction.

## Submission answers

### What did you build?

FactLedger is a read-only Solana wallet intelligence and verification API. It provides deterministic wallet risk and intelligence signals, token security checks, and transaction-level evidence through REST and MCP interfaces. The system is designed to expose what it knows, what it does not know, and the exact evidence behind each important result.

### What problem does it solve?

Developers often have to trust wallet-analysis scores they cannot independently verify. FactLedger makes those outputs auditable by tying analysis to explicit on-chain evidence and by returning unknown values as null instead of plausible estimates.

### Why is it different?

The product treats uncertainty as a first-class output. It does not hide missing information behind confidence scores. Important results are deterministic and evidence-backed, making them easier to validate, debug, and safely consume in automated systems.

### Who is it for?

Solana developers building wallets, AI agents, security tools, dashboards, protocol risk systems, compliance workflows, and research tooling.

### Business model

The business model is still being validated. The leading model is a hosted API with usage-based or higher-capacity tiers for teams that need reliable production access, while keeping the core open-source under MIT. Integration support and sponsored protocol-verification work are possible additional revenue paths.

### Why this team?

FactLedger is founder-led and already built end-to-end by one developer, including the backend API, wallet intelligence logic, transaction evidence, live deployment, public demo, CI, and verification tooling. That allows the hackathon effort to focus on measurable product improvements rather than starting from an idea.

## Submission checklist

- [x] Colosseum account registered
- [x] Founder profile completed
- [x] Public GitHub repository available
- [x] Live API available
- [x] Public demo available
- [x] MIT open-source license
- [ ] Hackathon project creation opens
- [ ] Create FactLedger project in the hackathon portal
- [ ] Select the most accurate track/category
- [ ] Add repository URL
- [ ] Add live demo URL
- [ ] Upload or link pitch video
- [ ] Upload or link technical demo if required
- [ ] Complete final submission form
- [ ] Founder reviews declarations and presses final submit

## Important submission rules

- Do not claim FactLedger is incorporated unless a legal entity has actually been formed.
- Do not claim users, revenue, funding, awards, or partnerships without evidence.
- Do not describe optional AI explanation as the source of deterministic risk scores.
- Do not claim custody, signing, MPC, HSM, or transaction execution capabilities; FactLedger is read-only.
- Do not expose API keys, private keys, seed phrases, or other secrets in the repository or submission.
- Final account declarations, terms acceptance, wallet signatures, identity verification, and submission confirmation remain founder-controlled actions.
