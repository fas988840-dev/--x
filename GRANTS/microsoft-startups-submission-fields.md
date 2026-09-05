# Microsoft for Startups — prepared application answers

Status: prepared, **not submitted**. Current official guidance checked on 6 September 2026. The authenticated application still requires founder-controlled Microsoft sign-in, contact verification and Azure account setup.

## Project

**Name:** FactLedger  
**Founder:** Abdullah Al-Anzi  
**Location:** Saudi Arabia  
**Stage:** MVP / early prototype; choose the portal's matching option  
**Repository:** https://github.com/fas988840-dev/--x  
**Product URL:** https://factledger-api.onrender.com  
**Email:** fas988840@gmail.com  
**Phone:** 0532331116  
**X:** https://x.com/aamm123220  
**Telegram:** @abdullhaa11

## One-line description

A read-only Solana wallet intelligence API that never fabricates data. Every value is either verified on-chain or returned as null — never estimated. Every score cites the exact transactions behind it, so it can be independently recomputed.

## Product and problem

FactLedger helps developers inspect Solana wallet activity and token properties through a TypeScript API and MCP tools. It preserves transaction evidence, explains deterministic scoring factors and exposes unavailable information instead of inventing values. It never takes custody or signs transactions. The initial product is an MVP built by a solo founder; no existing users or revenue are claimed.

The code includes wallet analysis, token-security checks, agent-oriented outputs and an optional Pyth price provider. The provider is tested locally; production Pyth activation still needs account credentials and verified feed mappings. The public API health endpoint is available.

## Intended use of Azure

Use Azure for API hosting, observability, a durable store for read-only analysis records and controlled background data processing. Evaluate AI-assisted explanations that rephrase traceable results while keeping market facts and deterministic scoring outside the generative model.

Initial milestones: monitored deployment, reproducible demo, documented integration examples, production-grade telemetry, then measurement of genuine developer usage.

## Business model

The core repository is MIT licensed. The planned commercial model is a hosted API with paid usage tiers and integration support while retaining a useful open-source version. This is a business-model hypothesis, not current revenue or contracted demand.

## Why now / next 90 days

1. Complete and verify production Pyth configuration.
2. Move the live API to monitored production infrastructure.
3. Add durable storage where justified by product usage.
4. Publish reproducible integration examples and a developer walkthrough.
5. Recruit initial developer design partners and measure real API usage.

## Current Microsoft route

Official 2026 guidance states that Microsoft for Startups supports early-stage privately held, for-profit software companies headquartered where Azure is available. The standard no-investor-code path begins with Azure account creation and starter credits; higher benefits are unlocked based on eligibility and progress. Investor-network-backed startups can enter a referral code for expanded benefits.

The authenticated flow can require:

- Personal Microsoft account sign-in.
- Phone and email verification.
- Country/region and time zone.
- Registered startup name matching legal documents when the business-application route requests it.
- Address/billing details.
- Azure payment method and acceptance of Microsoft account terms.

## Fields that must not be invented

Registered legal company name/incorporation, registration identifiers, business/billing address, prior Azure credits, funding history, payment details, investor referral code, and any account verification codes must match the founder's actual records.

## Source and requested support

Apply through https://startups.microsoft.com/.

Official application guide: https://learn.microsoft.com/en-us/startups/microsoft-for-startups/application

Official programme overview: https://learn.microsoft.com/en-us/startups/microsoft-for-startups/overview

Request only the startup-credit level for which the portal verifies eligibility; do not describe the maximum programme ceiling as an awarded amount.