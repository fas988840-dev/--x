# FactLedger — Pricing and Revenue Operating Model

This document defines a validation-first commercial model for FactLedger. Pricing is a hypothesis until paid customers exist; no revenue, ARR, conversion, retention, or customer-count figures may be represented as actual unless sourced from production records.

## Commercial unit

FactLedger sells evidence and risk intelligence for Solana through one core engine exposed via API, dashboard, MCP/agents, alerts, and enterprise workflows. The commercial unit should be measured as authenticated analyses/API requests plus higher-value workflow features, not source-code access.

## Initial packaging hypothesis

### Developer
- Intended for evaluation, prototypes, and low-volume integrations.
- Limited monthly requests and conservative rate limits.
- Community support.
- No SLA.

### Pro
- Higher request allowance and burst limits.
- API keys for production integrations.
- Evidence/provenance output and alert features where available.
- Standard support.

### Business
- Higher throughput, team use, usage reporting, and priority support.
- Contractual data-retention and access-control options once supported.
- Optional design-partner roadmap access.

### Enterprise
- Custom limits, dedicated support, security review, SLA, procurement support, and negotiated data/retention requirements.
- Private deployment or dedicated infrastructure is a future option only when technically supported and commercially justified.

## Pricing method

Do not select final prices by competitor imitation alone. Validate willingness to pay across three axes:

1. **Usage value:** analyses/API requests per month and peak rate.
2. **Workflow value:** alerts, evidence history, agent/MCP usage, investigations, team access.
3. **Risk/reliability value:** SLA, support, retention, provenance, auditability, and procurement requirements.

For each qualified design partner, record expected monthly usage, critical workflow, acceptable latency, data-retention need, procurement constraints, and stated willingness-to-pay range.

## Metering architecture requirements

Before charging money, production should support:

- organization/customer identifier;
- API-key ownership and revocation;
- authenticated request counting;
- route or capability-level usage dimensions;
- rate-limit policy by plan;
- immutable usage events or auditable aggregates;
- billing-period boundaries;
- idempotent payment-webhook handling if a gateway is connected;
- entitlement checks independent of the payment provider;
- explicit free/paid/enterprise plan state;
- no secret payment credentials in source control.

## Micropayments

Micropayments should not be the primary launch model until a buyer use case proves they are preferable to subscription/API billing. If implemented, payment settlement must be separated from intelligence computation, use idempotent receipts, and never require FactLedger to custody customer private keys.

## Metrics that determine commercial readiness

Track only measured values:

- authenticated API requests;
- active integrations;
- weekly active organizations;
- paying organizations;
- MRR and ARR;
- average revenue per account;
- gross margin / infrastructure cost per 1,000 analyses;
- trial-to-paid conversion;
- retention/churn;
- expansion revenue;
- sales-cycle duration.

## Decision rule

Do not build a billing feature merely to look like a SaaS. Implement the smallest billing/metering layer that supports a real customer transaction, then extend it from observed demand.