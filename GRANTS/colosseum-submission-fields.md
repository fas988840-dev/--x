# Colosseum Eternal — Prepared Submission

**Status 2026-09-06:** Existing Eternal sprint verified by Gmail evidence. The inbox contains `Your Eternal sprint has started — here's your four weeks` dated 2026-08-29, plus Week 1 reminder emails dated 2026-09-03 and 2026-09-04. Continue this existing sprint; do not start a duplicate product submission. The Week 1 update may already be late, so submit/repair it inside Colosseum Arena immediately if the dashboard still allows it.

Official position: Colosseum Eternal is a four-week crypto startup sprint with weekly one-minute update videos and a final product submission. The Eternal Award is a $25,000 non-dilutive prize. Standout startups may also be considered for $250,000 in pre-seed accelerator funding. The $250,000 is not an automatic grant.

**How to use:** copy each block below into the matching Colosseum field. Video uploads and final submit still require the founder's authenticated Colosseum account.

---

## Product name

```text
FactLedger
```

---

## Short product description

```text
A read-only Solana wallet intelligence API whose scores can be independently reproduced. Every value is either verified on-chain or returned as null, with explainable scoring factors and exact transaction evidence.
```

---

## Longer product description

```text
Wallet risk scores increasingly gate real decisions on Solana: protocol access, counterparty trust and compliance review. Today those scores often come from proprietary models that cannot be audited, or from heuristic tools that pattern-match program IDs and present the guess as fact. Neither tells builders what it does not know.

FactLedger is a read-only Solana wallet intelligence API built around one constraint: it never fabricates data. Any value it cannot verify — a price, a fee, a decoded swap amount or a token-risk field — is returned as null, never as a plausible estimate. Every score ships with the named factors that produced it and the specific transactions it read, so a reviewer can pull those transactions from a public RPC and independently recompute the result.

The MVP is live at https://factledger-api.onrender.com and the repository is public under MIT at https://github.com/fas988840-dev/--x. The current codebase includes REST endpoints, MCP tools for AI clients, token-security checks, deterministic wallet risk/intelligence scoring and transaction evidence output. It never requests private keys, never stores seed phrases and never signs transactions.
```

---

## Team background

```text
I am Abdullah Al-Anzi, a solo founder based in Riyadh, Saudi Arabia. FactLedger is currently an MVP, not a registered company, and I am not claiming users, revenue, investment or awards yet.

My focus is to prove that a Solana intelligence product can be useful without hiding its assumptions. Existing wallet analytics often force builders to trust an opaque score. FactLedger takes the opposite approach: every result is either evidence-backed, provider-reported, derived from named deterministic factors, or explicitly unknown.

The current proof is engineering execution: a public MIT repository, a live API, TypeScript implementation, read-only architecture and a local verification run with 219 passing tests.
```

---

## GitHub repository

```text
https://github.com/fas988840-dev/--x
```

---

## Live product / demo URL

```text
https://factledger-api.onrender.com
```

Health endpoint:

```text
https://factledger-api.onrender.com/api/v1/health
```

---

## Immediate Week 1 update video script

Use this if the Colosseum dashboard still lets you submit the Week 1 update.

```text
This week I moved FactLedger from a concept into a verifiable MVP.

FactLedger is a read-only Solana wallet intelligence API. The core rule is simple: it never fabricates data. If a value cannot be verified on-chain or from an explicit provider response, the API returns null instead of estimating.

What I shipped: a live API, wallet analysis endpoints, token-security checks for mint and freeze authority, deterministic risk and intelligence scoring, transaction evidence output, and MCP tools so AI agents can call the same read-only pipeline. The repository is public and MIT licensed.

The most important technical progress is reproducibility. Every score is built from named factors and exact transaction evidence, and the test suite checks deterministic behavior so the same input produces the same output.

The main gap is still production hardening. I need dedicated Solana RPC access, real Pyth API activation, and more verified protocol adapters before I can call the data coverage production-grade. I am not claiming users or revenue yet. This sprint is about proving that the product works and that its outputs can be audited.
```

---

## Final pitch video script

```text
FactLedger is a read-only Solana wallet intelligence API for builders who need wallet and token data they can audit.

The problem is that most wallet-intelligence products return confidence without evidence. A score may look precise, but the user cannot tell which transactions produced it, which values were missing, or which protocol detections were only guesses. That is dangerous for agents, protocols and compliance workflows that may automate decisions from those scores.

FactLedger fixes this by making honesty part of the product contract. It never asks for private keys, never signs transactions and never takes custody. It reads public Solana data, calculates deterministic wallet risk and intelligence scores, and returns exact transaction evidence behind the result. Unknown values remain null. Candidate protocol detections remain candidate until the program and account layouts are verified.

The MVP is live, open-source under MIT, and backed by a test suite with deterministic checks. The next step is production hardening: dedicated Solana RPC infrastructure, monitoring, real Pyth activation, verified adapter coverage and developer documentation.

I am a solo founder based in Riyadh. I have no users or revenue yet, and I am stating that directly. The current evidence is the product itself: deployed, inspectable and built so its outputs can be recomputed rather than trusted blindly.
```

---

## Technical demo script

```text
In this demo I will show how FactLedger processes Solana wallet intelligence without fabricating missing data.

The API starts with read-only Solana RPC calls. It retrieves wallet transactions and token information, then normalizes those facts before any scoring happens. The system does not request or store private keys and never signs transactions.

Next, the analysis layer calculates behavioral metrics and deterministic risk/intelligence scores. These scores are not black-box model outputs. Each score is built from named factors such as activity, diversity, success rate, concentration and suspicious patterns. The same input produces the same output.

The evidence endpoint exposes the transaction signatures, slots, programs and confidence states behind the analysis. If a DEX instruction is not fully verified, it remains candidate or unknown. If price data is unavailable, the price is null. If token authority checks are clean, the response still lists what was not checked, so nobody can misread it as a full safety guarantee.

The same pipeline is exposed through REST endpoints and MCP tools for AI clients. That means an agent can call wallet intelligence, wallet risk, evidence, alerts and research report tools without receiving invented facts.

The current limitation is coverage: Raydium and Jupiter detection need deeper account-layout verification, Pyth needs real production activation, and the live alert stream needs a dedicated RPC provider. Those are the next milestones.
```

---

## Anything else critical to understanding the vision

```text
Three things matter for evaluating FactLedger.

First, the product is intentionally conservative. Unknown values are returned as null. DEX detections stay candidate until verification is complete. Token-security checks state both what was checked and what remains unchecked. This makes the product look less complete than systems that guess, but safer for developers who need auditable outputs.

Second, the current traction is engineering proof, not market traction. The API is deployed, the repository is public under MIT, and the local verification run reports 219 passing tests. I am not claiming users, revenue, investment or awards.

Third, the business model is still being tested. The candidates are hosted API usage tiers, integration support and sponsored protocol verification. The open-source repository remains useful either way.
```

---

## If asked: How will you use funding?

```text
Funding would go to three areas.

First, production infrastructure: dedicated Solana RPC access, monitoring, error tracking and stable hosting for the live API.

Second, verified protocol coverage: independently verify more Solana program IDs and account layouts so adapters can move from candidate to confirmed with real amount extraction.

Third, distribution and documentation: publish integration examples, recruit initial developer design partners and measure real API usage.
```

---

## If asked: Business model

```text
Unproven, and I do not want to invent traction. The first model to test is usage-based hosted API access for teams that need auditable wallet and token intelligence. A second model is sponsored protocol verification, where protocols pay for independently verified adapter support while the core repository remains MIT licensed.
```

---

## Before pressing submit

- Upload the weekly update video if still available.
- For the final submission, upload an unlisted pitch video and technical walkthrough, or direct files if Colosseum supports uploads.
- Do not claim a registered company; FactLedger is currently an MVP without documented incorporation.
- Do not call the $250,000 an automatic grant; it is selective accelerator/pre-seed funding consideration.
- Do not submit a duplicate product for the same Eternal sprint.
