# Microsoft for Startups — prepared application answers

Status: prepared, **not submitted**. The official “Get started” entry led to
Microsoft account sign-in on 5 September 2026. These are answer blocks for the
actual portal, not a claim that every listed field is present there.

## Project

**Name:** FactLedger  
**Founder:** Abdullah Al-Anzi  
**Location:** Saudi Arabia  
**Stage:** MVP / early prototype; choose the portal's matching option  
**Repository:** https://github.com/fas988840-dev/--x  
**Product URL:** https://factledger-api.onrender.com  
**Contact:** fas988840@gmail.com

## One-line description

An open-source, read-only Solana wallet intelligence API and MCP server that
separates observed data, derived scores and unknown results for developers and
AI agents.

## Product and problem

FactLedger helps developers inspect Solana wallet activity and token
properties through a TypeScript API and MCP tools. It preserves transaction
evidence, explains deterministic scoring factors and exposes unavailable
information instead of inventing values. It never takes custody or signs
transactions. The initial product is an MVP built by a solo founder; I am not
claiming existing users or revenue.

The code includes wallet analysis, token-security checks, agent-oriented
outputs and an optional Pyth price provider. The provider is tested locally;
production Pyth activation still needs account credentials and verified feed
mappings. The public API health endpoint is available, with the price
dependency currently reported as degraded.

## Intended use of Azure

I plan to use Azure for API hosting, observability, a durable store for
read-only analysis records and controlled background data processing. I also
want to evaluate AI-assisted explanations that rephrase traceable results;
model output must not create market facts or replace deterministic scoring.
The initial goal is a monitored pilot with a reproducible demo and documented
integration examples, followed by measuring real developer usage.

## Business model

The core repository is MIT licensed. I plan to test paid hosted API usage and
integration support while retaining a useful open-source version. These are
business-model hypotheses, not current revenue or customer contracts.

## Why now / next 90 days

Complete and verify the Pyth configuration; deploy monitored API infrastructure;
add durable storage where needed; publish a reproducible walkthrough; recruit
initial developer design partners and measure the first genuine API usage.

## Fields that cannot be truthfully pre-certified

Legal company name/incorporation, registration identifiers, prior Azure credits,
funding history and any investor referral must match the founder's actual
account and records. No LinkedIn or phone value was found in the checked
materials. Do not invent an incorporation date, referral code or forecast.

## Source and requested support

Apply through https://www.microsoft.com/startups. Request the level of startup
credit support for which the portal verifies eligibility; do not claim a
$150,000 award or guaranteed free OpenAI access. Current terms:
https://learn.microsoft.com/en-us/startups/microsoft-for-startups/overview.
