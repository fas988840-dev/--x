# FactLedger MCP Agent Examples

FactLedger exposes its read-only Solana intelligence pipeline over MCP. The
examples below are designed for real agent builders and preserve the same
honesty constraints as the REST API: UNKNOWN stays UNKNOWN, candidate protocol
classification is not promoted to verified, and no tool signs transactions.

## Start the server

```bash
npm install
npm run mcp
```

The server uses stdio. Configure the MCP host to spawn the project command and
set environment variables in the host configuration rather than hard-coding
secrets in prompts or source files.

Recommended production environment:

```text
SOLANA_RPC_URL=<dedicated read-only Solana RPC endpoint>
CHAINGPT_API_KEY=<optional; explanation prose only>
```

Never add wallet seed phrases, private keys, signing keys, or access tokens to
an MCP prompt.

## Available tools

- `wallet_intelligence` — observable wallet facts and balances.
- `transaction_lookup` — one transaction with instruction classifications.
- `wallet_risk` — deterministic 0–100 risk score and named factors.
- `wallet_research_report` — wallet + risk synthesis that propagates UNKNOWN.
- `wallet_alerts` — one-shot evidence-based alert evaluation.
- `wallet_explanation` — ChainGPT phrasing over already-computed facts, with a
  deterministic fallback when ChainGPT is unavailable.
- `market_events` — currently returns UNKNOWN because there is no live market
  event feed behind this tool yet.

## Agent pattern 1 — wallet due-diligence assistant

System instruction:

```text
Use FactLedger tools as the evidence source for Solana wallet claims. Start
with wallet_intelligence and wallet_risk. Use wallet_research_report only as a
summary of those facts. If evidenceStatus is UNKNOWN, state that the fact is
unavailable. Do not infer ownership, identity, intent, legality, or future
price. Do not give a wallet a safer classification merely because data is
missing.
```

Suggested flow:

```text
wallet_intelligence(address)
→ wallet_risk(address)
→ wallet_alerts(address)
→ wallet_research_report(address)
```

## Agent pattern 2 — transaction investigator

```text
transaction_lookup(signature)
```

Then require the calling agent to separate instruction states:

```text
confirmed  = decoded by a registered/verified adapter
candidate  = resembles a known activity but is not verified
unknown    = insufficient evidence
```

Never turn `candidate` into `confirmed` in downstream prose.

## Agent pattern 3 — explain risk to a non-technical user

```text
wallet_explanation(address)
```

The caller should display `summarySource`. A value of `deterministic` means the
ChainGPT path was unavailable and FactLedger generated the fallback from the
same computed facts. This is expected fail-safe behaviour, not an error that
should be hidden.

## Agent pattern 4 — alert triage

```text
wallet_alerts(address)
```

Use alerts as triage signals, not accusations. Each alert must be linked back
to its observed trigger numbers before an external action is taken.

## Agent pattern 5 — batch portfolio review

For a list of addresses, call `wallet_risk` and `wallet_intelligence` per
wallet with bounded concurrency. Store the returned evidence status alongside
each score. Rank only wallets whose required evidence is present; place UNKNOWN
results in a separate review queue rather than assigning them a synthetic
score.

## Integration acceptance checklist

An external MCP integration is ready to count as a real product integration
only when all of the following are observed:

- the MCP host successfully spawns the FactLedger server;
- `tools/list` exposes the expected tools;
- at least one real read-only wallet call completes against the configured RPC;
- invalid addresses fail without fabricated output;
- UNKNOWN/candidate states are preserved by the host agent;
- no secret or signing material appears in logs or prompts.

Until a real MCP host passes this checklist, MCP E2E remains UNVERIFIED even if
the server code builds locally.
