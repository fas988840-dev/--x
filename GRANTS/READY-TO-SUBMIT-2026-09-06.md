# FactLedger — Ready-to-submit grant pack

Updated: 2026-09-06

## Shared proof links

- Production API: https://factledger-api.onrender.com
- Health: https://factledger-api.onrender.com/api/v1/health
- Interactive demo: https://factledger-demo.onrender.com/demo.html
- Source: https://github.com/fas988840-dev/--x

## Finternet Instagrant — request: 4,000 USDC

### One-line positioning
FactLedger is a read-only Solana risk-verification layer for financial applications, wallets, and agents: deterministic wallet intelligence with transaction-cited evidence and explicit unknown/null states instead of guesses.

### Problem
Financial applications increasingly depend on wallet-level signals, but most wallet scores are opaque and difficult to independently verify. That makes them hard to trust in interoperable financial systems and difficult for downstream applications to audit.

### Solution
FactLedger converts observable Solana activity into deterministic behavioral metrics, intelligence scoring, risk assessment, and evidence records. Each supported finding can be traced to the exact on-chain activity behind it, while unavailable or unverified data remains unknown/null rather than being estimated.

### Why this fits Finternet
FactLedger is infrastructure for interoperable financial applications on Solana. It gives wallets, fintech applications, and software agents a common read-only risk-verification primitive that can be independently checked and integrated over REST/MCP interfaces.

### Milestones
1. **1,200 USDC — Integration contract and financial examples (week 1–2)**
   - Harden wallet analysis/risk/evidence response contracts.
   - Publish two concrete integration examples for wallets/financial apps.
   - Document unknown/null and confidence semantics.

2. **1,600 USDC — Production reliability and evidence path (week 2–4)**
   - Harden live price-provider failure handling and monitoring.
   - Add end-to-end tests across API → Solana RPC → evidence output.
   - Document provider/RPC failure behavior and recovery.

3. **1,200 USDC — Integration demo and real usage proof (week 4–6)**
   - Publish an end-to-end integration demo.
   - Capture genuine API usage telemetry from external testing/design partners.
   - Publish a short integration guide and reproducibility checklist.

### Expected outcome
A production-grade, auditable wallet-intelligence primitive on Solana that financial apps, wallets, and agents can integrate against, with reproducible scoring, cited evidence, monitored reliability, and documented real usage.

### Team
Abdullah Al-Anzi — solo founder/developer, Riyadh, Saudi Arabia. Built FactLedger end-to-end: read-only Solana data pipeline, deterministic scoring and risk logic, evidence engine, REST/MCP interfaces, deployment, and security/CI setup.

---

## ChainGPT Builder — credits-first request

### Project
FactLedger

### Summary
FactLedger is a read-only Solana wallet intelligence API that computes deterministic behavioral metrics, wallet scoring and risk, cites the evidence behind supported findings, and returns unknown/null when data is unavailable or not verified.

### ChainGPT integration role
ChainGPT is used only as an explanation layer over FactLedger's already-computed deterministic results. It is not the source of truth and cannot alter the score, risk factors, or cited evidence. If ChainGPT is unavailable, FactLedger falls back to deterministic summaries.

### Current stage
MVP / early prototype with a publicly deployed production API and open-source code.

### What is built
- Read-only Solana transaction/token pipeline.
- Deterministic wallet intelligence and risk scoring.
- Evidence citations and confidence states.
- REST and MCP interfaces.
- Explicit unknown/null behavior for unverifiable data.
- Public production deployment and interactive demo.

### Request
Up to **10,000 USD equivalent in ChainGPT API credits under the Builder tier**. FactLedger is not claiming eligibility for traction-gated cash funding at the current stage.

### Planned use of credits
- Test and harden the explanation layer over real deterministic wallet outputs.
- Evaluate provider failures and deterministic fallback behavior.
- Improve prompt/output consistency without allowing AI prose to change source facts.
- Document and validate the integration through real API calls.

### Expected outcome
A production-ready ChainGPT explanation integration where AI helps users understand deterministic wallet intelligence while FactLedger preserves the independently verifiable evidence trail.

### Important current gate
`CHAINGPT_API_KEY` must be created in the founder's authenticated ChainGPT account and added to the production environment before claiming that the live ChainGPT integration is active.

---

## Colosseum Eternal — weekly/demo material

### Week update script (~60 seconds)
FactLedger is a read-only Solana wallet intelligence system built around one rule: the wallet score should be something you can check yourself. The production API is live, and the core flow now goes from a public wallet address to deterministic behavioral analysis, risk assessment, and evidence that points back to the underlying on-chain activity. When FactLedger cannot verify a value, it returns unknown or null instead of guessing. I also shipped a public interactive demo so reviewers and developers can exercise the production endpoints directly. My next focus is external integration testing and making the evidence contract easier for wallets, fintech apps, and agents to consume.

### 2–3 minute technical demo flow
1. Open https://factledger-demo.onrender.com/demo.html
2. Run Production Health.
3. Paste a real public Solana wallet address.
4. Run Analysis.
5. Run Risk.
6. Run Evidence and point out transaction-cited fields such as signature/slot/program/confidence where present.
7. Show a genuine unknown/null field if one appears; explain that this is intentional.
8. Run Token Security with a real mint.
9. Run Token Price and show either a live provider result or null.
10. Close with: **“Don’t trust the score — check it.”**

### Recording rule
Use a real public address and genuine live responses. Do not pre-fill or edit outputs to look better. If an endpoint fails during rehearsal, fix it before recording the final continuous demo.

---

## Submission integrity rules

- A draft is not a submission.
- A sent email is not a portal submission unless the program explicitly accepts email applications.
- Do not mark Finternet, ChainGPT, or Colosseum final as submitted without a confirmation page, receipt, or confirmation email.
- Do not claim users, revenue, registered entity status, awards, or active ChainGPT production integration unless independently verified.
