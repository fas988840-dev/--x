# FactLedger Evidence/Risk Graph

FactLedger's long-term defensibility depends on more than a point-in-time wallet score. The Evidence/Risk Graph provides an append-only model for linking wallets, transactions, tokens, programs, counterparties, evidence claims, and risk events with explicit provenance.

## Current implementation

`src/services/evidence-graph.ts` defines a storage interface and an in-memory implementation with:

- deterministic SHA-256 observation IDs;
- append-only semantics with idempotent duplicate writes;
- `confirmed`, `candidate`, and `unknown` confidence states;
- source/provenance references;
- ruleset versioning;
- optional expiry/revalidation timestamps;
- optional 0–100 risk score snapshots;
- entity history and chronological risk timelines;
- defensive copies so callers cannot mutate stored observations.

## Important production limitation

The current store is intentionally **in-memory only**. It is suitable for tests and integration work but is not durable across service restarts and must not be represented as a production historical database.

The next production adapter should implement the same `EvidenceGraphStore` interface against a durable datastore with retention, access-control, backup, and provenance requirements defined before storing customer-derived intelligence.

## Graph model

```text
Wallet
  ├── Transaction
  │     ├── Program
  │     ├── Token
  │     └── Counterparty
  ├── Evidence
  └── Risk Event
```

Every observation records what was observed, when, where it came from, its confidence state, and the ruleset version that produced it. UNKNOWN remains a first-class state; missing data must never be converted into fabricated certainty.

## Commercial role

The graph is intended to become FactLedger's historical evidence layer: a reproducible intelligence history that can power the API, dashboard, MCP/agents, alerts, investigations, and future enterprise workflows from one evidence model.
