# Pyth — integration support and grant proposal

Status: **prepared, not submitted**. No active general $1–5k developer grant
form was verified on 5 September 2026. This is a proposal for a suitable live
programme or an integration-support inquiry, not a closed-bounty submission.

## Project / founder

FactLedger — Abdullah Al-Anzi, solo founder in Saudi Arabia.  
Repository: https://github.com/fas988840-dev/--x  
Email: fas988840@gmail.com · X: @aamm123220 · Telegram: @abdullhaa11

## Short description

A read-only Solana wallet intelligence API and MCP server integrating
provider-reported Pyth USD quotes while preserving publication times,
uncertainty and explicit unknown results.

## Integration completed in code

FactLedger's Pyth Hermes adapter is wired into a REST token-price endpoint and
the MCP token_price tool through one provider factory. The adapter requires
an API key and explicit mint/feed mapping, validates response structure and
numeric values, rejects stale or future quotes, bounds request time and
returns UNKNOWN for unavailable data. It includes the feed identifier,
publication timestamp and confidence interval in usable quotes.

These responses are clearly labelled provider-reported. The integration does
not claim local cryptographic verification, on-chain price updates or
completed wallet PnL calculations. Tests cover the provider, REST validation
and authentication, and an in-memory MCP client/server roundtrip. The full
local suite passes 219 tests. Live Pyth activation is still pending a real
key and a verified mapping; the existing production price dependency is
degraded.

## Proposed support request

I would like integration guidance and eligible developer access/credits first,
and consideration for a suitable developer grant with a proposed $5,000
milestone budget if a current programme accepts this scope. This amount is my
request, not a published entitlement or confirmed award.

| Milestone | Proposed amount | Acceptance evidence |
|---|---:|---|
| Verify feed mappings, activate and document the deployed Pyth path | $1,500 | Current live quote evidence, publication age, failure examples and reproducible setup |
| Expand integrity and integration examples for Solana developers | $2,000 | Reviewed code and test fixtures covering mapping errors, unavailable feeds and caller-facing handling |
| Run a monitored pilot and publish integration documentation | $1,500 | Operational observations, reusable REST/MCP examples and documented limits; any usage figures based on actual measurements |

Timing: approximately six weeks from confirmed access and an agreed grant
scope. The already-completed code is evidence of capability; funding is for
remaining deliverables, not a claim of reimbursable historic work. Keep costs
separate from any other grant that funds the same milestone.

## Team / stage / concurrent applications

Solo, full-time founder; early MVP without users reported in current project
materials. Other applications reported submitted: Solana Foundation, Webacy /
DD.xyz, ChainGPT and the Superteam Solana Summit programme. Colosseum is in
progress. No cash award is represented by these application statuses.

## Official routing and evidence

- Pyth ecosystem grants: https://legacy.pyth.network/grants (programme/bounty-specific terms, historical token pool).
- Pyth Core upgrade and access: https://docs.pyth.network/price-feeds/core/upgrade/preparing.
- Pyth Terminal: https://pythdata.app.
- The upgrade guide names **data@dourolabs.xyz** for plan/support discussions. A message there would be an integration/access inquiry, not proof of filing a Pyth grant.
- Implementation and real-key check: ../PYTH_INTEGRATION.md.

## Draft subject and inquiry

Subject: FactLedger — Pyth Core integration access and suitable developer support

Hello Pyth / Douro Labs team,

I am Abdullah Al-Anzi, a solo founder in Saudi Arabia building FactLedger, an
MIT-licensed, read-only Solana wallet intelligence API and MCP server:
https://github.com/fas988840-dev/--x.

I have implemented a Hermes provider and wired token prices into REST and MCP,
with explicit mappings, publication-age validation and honest UNKNOWN results
when data is unavailable. The code is locally tested; I still need to complete
real-key activation and verify the deployed integration.

Could you advise on developer access/credits and direct me to any currently
open programme or bounty that accepts this scope? I have a proposed $5,000
milestone plan for activation, integration examples and a monitored pilot,
but would like to confirm the appropriate route before filing a grant request.

Thank you,
Abdullah Al-Anzi
fas988840@gmail.com
