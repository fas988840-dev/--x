# Positioning: the evidence layer for Solana AI agents

A sharper framing than "wallet analytics API", and a better fit for ChainGPT's
AI grant. Below is the version that survives a reviewer opening the code.

Six claims in the first draft did not. They are listed at the end with what
the codebase actually does, because a reviewer who checks and finds a mismatch
discounts everything else on the page — and for a project whose whole pitch is
"we don't overstate", getting caught overstating is fatal in a way it would
not be for another product.

---

## Title

```
FactLedger — the evidence layer for Solana AI agents.
Deterministic facts, explicit unknowns, never a guess.
```

## Problem

```
AI agents are starting to act on Solana — trading, routing, gating access.
They act on whatever their data layer hands them, and today that layer
cannot tell them what it does not know.

A price lookup that quietly failed returns a plausible number. A swap that
was never verified is labelled a swap. An unverified program is reported as
a known protocol. The agent has no way to distinguish any of it from
something checked on-chain, so it acts with equal confidence on both.

The failure is not that the model hallucinates. It is that the data layer
gives it nothing to be uncertain about.
```

## Solution

```
FactLedger is a read-only Solana data layer that never returns a fact it
cannot support, and labels the confidence of everything it does return.

Every DEX instruction carries one of three statuses — VERIFIED, CANDIDATE,
UNKNOWN — and they are never collapsed to make output look more complete.
Every unavailable value (a price, a fee, a decoded amount) comes back null,
never as an estimate. Every score ships with the named factors that produced
it and the transactions it read.

For an agent, that turns an unknown into a signal it can branch on: a
CANDIDATE swap or a null amount is an explicit instruction not to proceed as
if the value were known. The agent decides what to do; FactLedger's job is to
make sure it is never confidently wrong about which of its inputs were
actually checked.
```

## Architecture

```
Seven read-only agents over one deterministic pipeline
(src/agents/core_agents.ts):

  WalletIntelligenceAgent      wallet facts read from chain
  TransactionIntelligenceAgent single-transaction parsing
  RiskAgent                    deterministic risk factors
  ResearchAgent                composes the two above
  AlertAgent                   fixed, documented alert conditions
  ExplanationAgent             ChainGPT restates computed facts only
  MarketEventAgent             always UNKNOWN — no event pipeline exists

Every agent returns AgentResponse<T> with evidenceStatus and confidenceScore,
VERIFIED/1 only when the value was genuinely read from the pipeline, and
UNKNOWN/0/null whenever the capability is not implemented or the call failed.
MarketEventAgent returning UNKNOWN in every case is the contract working, not
a gap to paper over.

Exposed three ways: 13 REST endpoints, a deterministic agent router
(explicit intent enum — no NLP guessing), and an MCP server over stdio.

151 tests pass on GitHub's runners, including a determinism check that calls
each scorer twice with fixed input and asserts exact equality, failing the
build if scoring ever stops being reproducible.
```

## Why an agent builder should care

```
An agent that cannot tell a checked value from an unchecked one has no safe
way to be cautious. Giving it a typed, three-state confidence signal on every
field is what makes caution expressible in code rather than in a prompt.

The separation is reusable. Any project putting a model near financial data
can adopt it: compute deterministically, let the model restate, never let it
originate. FactLedger's own LLM integration follows exactly that rule —
ChainGPT rephrases already-computed numbers and is structurally unable to
introduce a new one, because three of the four response fields are built from
pipeline output regardless of what the model returns.
```

## Honest state

```
Solo developer, full time. No users yet. Deployed, but on a free tier and the
public Solana RPC — https://factledger-api.onrender.com

Raydium and Jupiter detection verifies the instruction type but not the
account layout, so amounts stay null and status stays CANDIDATE. The live
WebSocket alert stream is unit-tested but not yet exercised against a real RPC
subscription. The MCP server imports the real SDK but is excluded from the
type-checked build and has not been run against a real MCP client.

All of this is in the repository's own documentation. A layer selling
calibrated confidence has to be calibrated about itself.
```

---

## What was corrected, and why

| Draft claim | What the code shows |
|---|---|
| "the five agents" | `src/agents/core_agents.ts` exports **seven** |
| `INSUFFICIENT_EVIDENCE` | Not in the codebase. The real values are `VERIFIED`, `CANDIDATE`, `UNKNOWN` |
| "blocks execution when evidence is absent" | **Nothing executes.** `SolanaRpcClient` has zero signing or sending calls; read-only is a core invariant. The system cannot block an execution it never performs |
| "fully compatible with the MCP standard" | The MCP server is excluded from the type-checked build (`TS2589`) and `CLAUDE.md` says to treat correctness as unverified until exercised against a real client |
| "Solana Agent Kit" | Zero references anywhere in `src/` or `package.json` |
| "market in the billions" | No source. Drop it, or cite one a reviewer can check |

**On "blocks execution" specifically** — it was the strongest line in the
draft and the most dangerous. A technical reviewer who reads it and opens the
repository finds a read-only API that executes nothing, and the contradiction
is immediate.

The rewrite keeps the force and loses the falsehood: FactLedger does not block
the agent, it gives the agent something to refuse *on*. That is what the code
actually does, and it is still the interesting claim.

**On dropping the market number** — an unsourced "billions" adds nothing a
reviewer believes, and invites the one question you cannot answer. The
architecture is the argument.
