# FactLedger — application continuation plan

_Last updated: 2026-09-06_

This file resolves the current application-status differences and gives the clean continuation path for FactLedger. It is written for grant and accelerator submission work, not as a claim that funding has been received.

## Corrected source of truth

- Founder: Abdullah Al-Anzi.
- Location to use in forms: Riyadh, Saudi Arabia.
- Stage: MVP / early prototype.
- Entity status: not incorporated / no registered company currently documented.
- Project: FactLedger.
- Repository: https://github.com/fas988840-dev/--x
- Live API: https://factledger-api.onrender.com
- Project email: fas988840@gmail.com
- Microsoft account email: Xx053233@hotmail.com
- Phone: 0532331116
- X: https://x.com/aamm123220
- Telegram: @abdullhaa11
- Solana wallet: EWEY53t7rXLTQ964EhuAXHAMV9WoEkxn4h4fYB1ZRFNM

## Verified differences fixed

1. **Solana Foundation** — Gmail contains multiple `Solana Grant Submission Confirmation` emails in the founder inbox, including messages dated 2026-08-29, 2026-08-31 and 2026-09-04. Treat this as submitted; do not submit another duplicate application unless Solana requests a new one.
2. **Colosseum Eternal** — Gmail contains `Your Eternal sprint has started — here's your four weeks` dated 2026-08-29 and Week 1 reminder emails dated 2026-09-03 and 2026-09-04. Treat the sprint as started and continue the sprint; the Week 1 update may already be late, so the next action is to submit/repair the weekly update inside Colosseum Arena as soon as possible.
3. **Microsoft for Startups** — do not submit as an incorporated company. The founder has stated there is no registered company and the product is an MVP. Use the individual/early-stage path only if the portal accepts it; otherwise pause until a legal entity exists.
4. **Superteam Agentic Engineering Grant** — the public listing is Global but Applications Paused, so do not mark submitted.
5. **Regional Superteam listings** — do not use USA, UK, Balkan, India, Singapore, Malaysia, Nigeria, Germany, Canada or similar regional routes unless Saudi eligibility is explicitly available in the listing/account.

## Best current priority order

1. **Colosseum Eternal sprint continuation** — highest urgency because the sprint is already running and weekly updates affect evaluation.
2. **Microsoft for Startups** — proceed only through a truthful non-incorporated/early-stage route; otherwise wait until legal registration.
3. **Global Superteam/Solana listings** — use only listings that are Global or explicitly available to Saudi Arabia, and avoid duplicate Solana Foundation submissions.
4. **Pyth ecosystem support** — continue as a technical integration/support proposal after real API key activation and production quote evidence.

## Ready Colosseum weekly update script

Use this for the immediate weekly update video if the Colosseum form still allows submission.

```text
This week I moved FactLedger from a concept into a verifiable MVP.

FactLedger is a read-only Solana wallet intelligence API. The core rule is simple: it never fabricates data. If a value cannot be verified on-chain or from an explicit provider response, the API returns null instead of estimating.

What I shipped: a live API, wallet analysis endpoints, token-security checks for mint and freeze authority, deterministic risk and intelligence scoring, transaction evidence output, and MCP tools so AI agents can call the same read-only pipeline. The repository is public and MIT licensed.

The most important technical progress is reproducibility. Every score is built from named factors and exact transaction evidence, and the test suite checks deterministic behavior so the same input produces the same output.

The main gap is still production hardening. I need dedicated Solana RPC access, real Pyth API activation, and more verified protocol adapters before I can call the data coverage production-grade. I am not claiming users or revenue yet. This sprint is about proving that the product works and that its outputs can be audited.
```

## Best short answers for forms

### One-liner

```text
FactLedger is a read-only Solana wallet intelligence API that returns only verified on-chain facts or null, with deterministic scores backed by exact transaction evidence.
```

### Problem

```text
Solana builders often have to rely on wallet-risk and token-intelligence tools that mix observed facts, heuristics and hidden assumptions. When a price, swap decode or token-risk field is unavailable, many systems still return a plausible-looking answer. That makes the data hard to audit and unsafe to build automated decisions on.
```

### Solution

```text
FactLedger exposes a read-only API and MCP tools that separate observed blockchain facts, provider-reported data, derived scores and unknown values. It never requests private keys, never signs transactions and never treats missing information as a guess. Every score includes its factors and transaction evidence so reviewers can independently recompute it.
```

### Technical differentiation

```text
The product is built around deterministic scoring and explicit evidence states, not an opaque model. Unknown values are returned as null; DEX detections stay candidate until the program and account layout are verified; token-security checks state what was checked and what remains unchecked. The system is intentionally conservative because overstated confidence is the main failure mode in wallet intelligence.
```

### Traction

```text
Current traction is engineering proof, not user traction. The API is deployed, the repository is public under MIT, and the local verification run reports 219 passing tests. I am not claiming users, revenue, investment or awards yet.
```

### Business model

```text
The open-source repository remains MIT licensed. The business model to test is a hosted API with usage-based tiers, integration support, and sponsored protocol verification where projects pay for independently verified adapter coverage. This is a hypothesis, not current revenue.
```

### Use of funds / credits

```text
Funding will be used for dedicated Solana RPC infrastructure, monitoring and error tracking, production Pyth activation, verified protocol adapters, and integration documentation so Solana developers can evaluate and adopt the API.
```

### Founder/team

```text
I am Abdullah Al-Anzi, a solo founder based in Riyadh, Saudi Arabia. FactLedger is currently an MVP with no registered company entity documented, no team, no users and no revenue claimed. My focus is shipping a credible, auditable Solana intelligence product before making commercial claims.
```

## Do not write in forms

- Do not claim a registered company or incorporation date.
- Do not claim Microsoft $5,000, $25,000, $50,000 or $150,000 credits as already awarded.
- Do not claim the Colosseum $250,000 as a grant; it is selective pre-seed accelerator funding consideration.
- Do not claim the Colosseum $25,000 Eternal Award as received.
- Do not submit additional duplicate Solana Foundation applications while existing confirmations are present.
- Do not mark Superteam Agentic Engineering as submitted while Applications Paused.
