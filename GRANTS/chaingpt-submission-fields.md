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
tested but not deployed and has no users — that is what builder-stage means.
Claiming *growth* invites questions about traction you don't have yet.

**What to request:** $15,000–$20,000. Not the $50,000 maximum. The milestones
below cost roughly that, a solo developer asking for the ceiling reads as
unconsidered, and a right-sized ask with costed milestones is more fundable
than a big round number.

---

## Project name

```
FactLedger
```

---

## One-line description

```
A read-only Solana wallet intelligence API whose scores can be independently
reproduced, using ChainGPT to explain already-computed facts in plain language.
```

---

## Project description

```
Wallet risk scores increasingly gate real decisions on Solana: protocol
access, counterparty trust, compliance review. Today those scores come from
proprietary commercial models that cannot be audited, or from heuristic tools
that pattern-match program IDs and present the guess as a fact. Neither tells
you what it does not know.

FactLedger is a read-only Solana wallet intelligence API built on two rules
enforced in code rather than promised in documentation. It never fabricates:
any value it cannot verify — a price, a fee, a decoded swap amount — is
returned as null, never as a plausible estimate. And it never overstates
confidence: every DEX instruction is classified confirmed, candidate, or
unknown, and those three states are never collapsed to make output look more
complete than it is.

Every score ships with the named factors that produced it and the specific
transactions it read, so a reviewer can pull those from any public RPC and
recompute the score by hand.

Built today: twelve REST endpoints, an MCP server for AI clients, a Next.js
dashboard, and a read-only architecture that never requests or stores a
private key. 133 tests pass on GitHub's runners, including a determinism
check that fails the build if scoring ever stops being reproducible.
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

I think this is a pattern worth funding beyond my own project: it lets an LLM
carry the explanatory load in a domain where a fabricated number is a real
financial harm, without ever putting the model in a position to invent one.
Any project handling on-chain data could adopt the same separation.

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
$18,000 USD
```

---

## Milestones

```
Milestone 1 — Production deployment ($6,000, weeks 1-4)
Deploy the API to a public endpoint on a dedicated Solana RPC provider, with
uptime and error monitoring. Public RPC endpoints rate-limit and commonly
disable the WebSocket log subscriptions the live alert stream depends on.
Deliverable: a public API serving real wallet analysis, monitored, with the
ChainGPT explanation endpoint live and exercised against a real key.

Milestone 2 — Explanation layer hardening ($6,000, weeks 5-9)
Extend the ChainGPT integration beyond single-wallet summaries to the risk and
alert surfaces, with prompt work to keep every generated sentence traceable to
a computed value, plus response validation and regression tests that fail if a
generated summary asserts anything the pipeline did not produce.
Deliverable: explanation coverage across the API, with tests enforcing the
no-fabrication boundary.

Milestone 3 — Verified protocol coverage and documentation ($6,000, weeks 10-14)
Independently verify program IDs and account layouts for Orca and Magic Eden
so those adapters can move from candidate to confirmed with real amount
extraction, and publish a write-up of the AI-explainer architecture so other
teams can adopt the separation.
Deliverable: additional protocols at honestly-labelled confidence, and a
public technical write-up.
```

---

## Team

```
Solo founder, full time. Abdullah Al-Anzi, based in Saudi Arabia.

No team and no users yet, and I would rather say that directly than have you
find it. What I can point to is the code: TypeScript strict mode throughout,
no `any` types, 133 tests passing on GitHub's own runners, and a determinism
check wired into CI so the project's central claim is enforced automatically
rather than asserted in a README.
```

---

## Links

```
Repository:  https://github.com/fas988840-dev/--x
CI run:      https://github.com/fas988840-dev/--x/actions/runs/33426707893
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
exercised against a real RPC subscription. The API is not deployed to a public
URL. All three are stated in the repository's own documentation, not only here.

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
