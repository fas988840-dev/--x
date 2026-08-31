# ChainGPT Web3 AI Grant — Ready-to-Paste Submission

Apply at **https://www.chaingpt.org/web3-ai-grant**

Program: $1,000,000 total, up to **$50,000** per project, paid in USDT plus
product credits. Three tiers — growth (scaling), builder (early-stage),
research (newly launched). Requirement: a blockchain project that **uses
ChainGPT's AI**.

Every field is written out below. Copy and paste; you do not need to compose
anything. If a field on the real form doesn't match anything here, screenshot
it and ask rather than improvising.

**Which tier to pick:** *Builder* (early-stage). FactLedger is built and
tested and now deployed, but has no users yet — that is what builder-stage means.
Claiming *growth* invites questions about traction you don't have yet.

**⚠️ VERIFY THE CEILING BEFORE SENDING.** Two figures are in circulation and
they disagree: a search summary gave "up to $50,000 per project" across the
programme, while the grant page reportedly caps the **builder** tier at
**$5,000 USDC plus $10,000 in API credits**. chaingpt.org is unreachable from
where this was written, so it could not be checked here.

The amount and milestones below are written for the **$5,000 + credits**
reading, because that is the safer error: asking under a ceiling costs some
money, asking 3.6x over one reads as not having read the terms and can sink
the application outright. **If the page says the builder tier allows more,
scale the milestones up before sending.**

---

## Project name

```
FactLedger
```

---

## One-line description

```
The evidence layer for Solana AI agents: deterministic facts, explicit
unknowns, never a guess — with ChainGPT restating computed facts in plain
language without ever originating one.
```

---

## Project description

```
AI agents are starting to act on Solana — trading, routing, gating access.
They act on whatever their data layer hands them, and today that layer cannot
tell them what it does not know.

A price lookup that quietly failed returns a plausible number. A swap that was
never verified is labelled a swap. An unverified program is reported as a
known protocol. The agent has no way to distinguish any of that from something
genuinely checked on-chain, so it acts with equal confidence on both. The
failure is not that the model hallucinates — it is that the data layer gives
it nothing to be uncertain about.

FactLedger is a read-only Solana data layer that never returns a fact it
cannot support, and labels the confidence of everything it does return. Every
DEX instruction carries VERIFIED, CANDIDATE or UNKNOWN, and those states are
never collapsed to make output look more complete. Every unavailable value
comes back null, never as an estimate. Every score ships with the named
factors that produced it and the transactions it read, so it can be recomputed
by hand from any public RPC.

For an agent, that turns an unknown into a signal it can branch on: a
CANDIDATE swap or a null amount is an explicit instruction not to proceed as
if the value were known. The agent decides what to do; our job is to make sure
it is never confidently wrong about which of its inputs were actually checked.

Seven read-only agents sit over one deterministic pipeline, exposed as twelve
REST endpoints, a deterministic agent router with an explicit intent enum (no
NLP guessing), and an MCP server over stdio. 143 tests pass on GitHub's
runners, including a determinism check that calls each scorer twice with fixed
input and asserts exact equality — the build fails if scoring ever stops being
reproducible.
```

---

## How the project uses ChainGPT

*(The most important field. Be specific — they can read the code.)*

```
ChainGPT is already integrated and in the repository today, not proposed for
after funding. See src/services/chaingpt-client.ts and ExplanationAgent in
src/agents/core_agents.ts, exposed at GET /api/v1/wallet/:address/explanation.

The integration follows one rule: ChainGPT explains, it never originates a
fact. The prompt states only real numbers the deterministic pipeline has
already computed — transaction counts, risk score, risk reasoning — and
instructs the model to add nothing beyond them. It is never asked to analyse
a wallet from scratch.

Concretely, of the four fields in the response, three (keyActivities,
riskAssessment, patterns) are always built directly from pipeline output
regardless of whether the ChainGPT call succeeds. Only `summary` depends on
it, and the response carries `summarySource: "chaingpt" | "deterministic"` so
a consumer can always tell which produced it. If no API key is configured or
the call fails, it falls back to a deterministic sentence built from the same
facts — never to silence, and never to a guess.

I think this is a pattern worth funding beyond my own project. The industry
response to hallucination is usually to make the model better. This is the
other half: make the data layer honest enough that the model is never in a
position to invent a number, because every field it receives is already
labelled with whether anyone checked it.

Compute deterministically, let the model restate, never let it originate. Any
project putting an LLM near financial data can adopt that separation, and
ChainGPT is what makes the restating half work here.

Verification status, stated plainly: the client is written against ChainGPT's
documented REST contract — POST /chat/stream, Authorization: Bearer, body
{model:'general_assistant', question, chatHistory:'off'}, response
{status, data:{bot}} — and the code matches that contract on every point. It
has not yet been exercised against a live key, and the file's own header says
so. You are welcome to run it against a key of your own; the repository is
public and MIT licensed.
```

---

## Requested amount

```
$5,000 USDC, plus API credits if the tier includes them
```

*(Written for the builder tier. Confirm the real ceiling on the grant page and
scale up if it allows more — see the note at the top.)*

---

## Milestones

```
Milestone 1 — ChainGPT explanation coverage ($2,500, weeks 1-5)
The integration currently explains one surface: a single wallet's summary.
Extend it to the risk and alert surfaces, with prompt work that keeps every
generated sentence traceable to a value the deterministic pipeline computed,
plus regression tests that fail if a generated summary asserts anything the
pipeline did not produce. API credits, if included, go here — this is the
milestone that consumes them.
Deliverable: explanation coverage across the API, with tests enforcing the
no-fabrication boundary in CI.

Milestone 2 — Dedicated RPC and hardening ($1,500, weeks 6-9)
Move the deployed API onto a dedicated Solana RPC provider. The public
endpoint rate-limits and commonly disables the WebSocket log subscriptions the
live alert stream needs, which is the main thing holding that feature back.
Add error tracking and uptime monitoring.
Deliverable: the live API on dedicated infrastructure, monitored.

Milestone 3 — Publish the pattern ($1,000, weeks 10-12)
Write up the AI-explainer architecture — compute deterministically, let the
model restate, never let it originate — with the code and tests as the worked
example, so other teams putting an LLM near financial data can adopt the same
separation.
Deliverable: a public technical write-up and integration examples.
```

---

## Team

```
Solo founder, full time. Abdullah Al-Anzi, based in Saudi Arabia.

No team and no users yet, and I would rather say that directly than have you
find it. What I can point to is the code: TypeScript strict mode throughout,
no `any` types, 143 tests passing on GitHub's own runners, and a determinism
check wired into CI so the project's central claim is enforced automatically
rather than asserted in a README.
```

---

## Links

```
Repository:  https://github.com/fas988840-dev/--x
Live API:    https://factledger-api.onrender.com/api/v1/health
CI:          https://github.com/fas988840-dev/--x/actions
Contact:     fas988840@gmail.com
X / Twitter: @aamm123220
License:     MIT
```

---

## Anything else

```
Two things.

The honest gaps. Raydium and Jupiter detection verifies the instruction type
but not the account layout, so swap amounts stay null and status stays
"candidate". The live WebSocket alert stream is unit-tested but not yet
exercised against a real RPC subscription. All of these are stated in the repository's own documentation, not only here.

Concurrent applications. I have submitted to the Solana Foundation grant
program (confirmed received, awaiting review) and to the Startup Accelerator
Grant from Webacy / DD.xyz via Superteam Earn (confirmed received). Nothing has
been awarded. I mention it unprompted because you would ask, and because a
project built on not concealing things should not conceal this.
```

---

## Before you submit

- Pick **builder** tier, not growth.
- If they ask for a demo video, the pitch video recorded for Colosseum works
  as-is — it covers the same ground.
- If you get the live API test working first (see
  `src/services/chaingpt-client.ts` for the curl command), say so in the
  "How the project uses ChainGPT" field and delete the last paragraph there.
  That paragraph is written to be accurate either way.
