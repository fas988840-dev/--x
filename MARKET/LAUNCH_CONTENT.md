# FactLedger Launch Content Pack

Use only after the public Dashboard and API smoke test are verified. Replace
bracketed placeholders with evidence-backed values before publishing.

## Positioning

**FactLedger is the evidence and risk intelligence layer for Solana.**

It turns a wallet or transaction into machine-readable risk, evidence,
provenance, and explanation while preserving uncertainty instead of guessing.

## Short X launch post

```text
FactLedger is live: evidence and risk intelligence for Solana wallets and
transactions.

• read-only analysis
• deterministic risk signals
• evidence/provenance
• API + Dashboard + MCP tools
• UNKNOWN stays UNKNOWN

Demo: [VERIFIED_DASHBOARD_URL]
API/docs: [VERIFIED_DOCS_URL]
GitHub: [REPO_URL]
```

## Technical X thread

```text
1/ We built FactLedger to answer a simple question: can software inspect a
Solana wallet without inventing certainty?

2/ The pipeline reads on-chain activity, parses known protocol interactions,
builds behavioural/risk signals, and returns evidence with confidence states.

3/ Protocol detection is explicit: confirmed, candidate, or unknown. Missing
data is not silently converted into a score or claim.

4/ The same engine powers the REST API, Dashboard, MCP tools, alerts, and the
Evidence/Risk Graph.

5/ ChainGPT is used only to explain already-computed facts. If it is unavailable,
FactLedger falls back to deterministic prose instead of changing the result.

6/ The system is read-only: no wallet custody, no transaction signing, no seed
phrases.

7/ We are looking for design partners building wallets, compliance/forensics,
trading/risk, protocols, or AI agents on Solana.

Try it: [VERIFIED_DASHBOARD_URL]
```

## Design-partner outreach

Subject: Solana evidence/risk API — design partner

```text
We are testing FactLedger with a small number of Solana teams.

FactLedger accepts wallets/transactions and returns structured risk, evidence,
provenance, and confidence states through an API and MCP tools.

We are looking for teams that have a real wallet-risk, transaction-review, or
agent-safety workflow. The goal is not a generic product demo: we want one
specific workflow, a measurable before/after, and direct feedback on what is
missing.

If that matches your product, I can share a short demo and pilot scope.
```

## Community post

```text
Building on Solana and need wallet/transaction intelligence that does not guess?
FactLedger exposes read-only risk + evidence through API, Dashboard and MCP.

We are opening a limited design-partner round for teams working on wallets,
security/compliance, trading/risk, protocols and AI agents.

Looking for real workflows, not vanity integrations.
[VERIFIED_DEMO_URL]
```

## Announcement gate

Do not publish "live", "production-ready", user counts, revenue, grant status,
partner names, or uptime claims until each statement has direct evidence. In
particular, Dashboard launch content waits for a successful Vercel deploy and
Dashboard → API smoke test.
