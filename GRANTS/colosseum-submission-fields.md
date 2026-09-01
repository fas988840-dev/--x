# Colosseum Eternal — Ready-to-Paste Submission

**How to use:** copy each block below into the matching field at
https://www.colosseum.com. Every field is written out in full English. You do
not need to write anything yourself.

If a field on the real form doesn't match anything here, screenshot it and
ask — don't improvise.

---

## Product name

```
FactLedger
```

---

## Short product description

*(One or two lines. Use this if the field is short.)*

```
A read-only Solana wallet intelligence API whose scores can be independently
reproduced. Every value is either verified on-chain or returned as null —
never estimated — and every score cites the exact transactions behind it.
```

---

## Longer product description

*(Use this if the field allows a paragraph.)*

```
Wallet risk scores increasingly gate real decisions on Solana: protocol
access, counterparty trust, compliance review. Today those scores come from
proprietary commercial models that cannot be audited, or from heuristic tools
that pattern-match program IDs and present the guess as a fact. Neither tells
you what it does not know.

FactLedger is a read-only Solana wallet intelligence API built on two rules
enforced in code rather than promised in documentation. First, it never
fabricates: any value it cannot verify — a price, a fee, a decoded swap
amount — is returned as null, never as a plausible estimate. Second, it never
overstates confidence: every DEX instruction is classified confirmed,
candidate, or unknown, and those three states are never collapsed to make the
output look more complete than it is.

Every score ships with the named factors that produced it and the specific
transactions it read. A reviewer can pull those transactions from any public
RPC and recompute the score by hand. Trust is not the mechanism —
verification is.

Built and deployed today at https://factledger-api.onrender.com: thirteen REST
endpoints, an MCP server for AI clients, a Next.js dashboard, and a read-only
architecture that never requests or stores a private key. 151 tests pass on
GitHub's runners, including a determinism check that runs on every push and
fails the build if scoring ever stops being reproducible.
```

---

## Team background

```
Solo founder, working on this full time. Abdullah Al-Anzi, based in Saudi
Arabia.

I have no team and no users yet, and I would rather say that directly than
have you find it out. What I can point to is the code: TypeScript strict mode
throughout, no `any` types, 151 tests passing on GitHub's own runners, and a
determinism check wired into CI so the project's central claim is enforced
automatically rather than asserted in a README.

I built FactLedger because the existing wallet analytics on Solana force a
choice between opaque commercial tools and heuristic guessing that mislabels
its output as fact. My design response was to make honesty a constraint the
code enforces on me, not a value statement — including where that makes the
product look less capable than competitors that guess.
```

---

## GitHub repository

```
https://github.com/fas988840-dev/--x
```

*(If they ask for CI evidence, this is the run referenced in the videos:)*

```
https://github.com/fas988840-dev/--x/actions/runs/33426707893
```

---

## Videos

Upload the two files you recorded. If the form asks for links instead of
uploads, put them on YouTube as **Unlisted** (not Private — reviewers cannot
open Private) and paste the links.

Suggested titles if asked:

```
FactLedger — Pitch
```

```
FactLedger — Technical Walkthrough
```

---

## "Anything else critical to understanding the vision"

```
Three things worth knowing before you evaluate this.

First, the honest gaps. Raydium and Jupiter detection verifies the
instruction type but not the account layout, so swap amounts stay null and
the status stays "candidate" rather than "confirmed". The live WebSocket
alert stream is unit-tested but has not been exercised against a real RPC
subscription. Prices come from CoinGecko's free API and return null often.
The API is deployed at https://factledger-api.onrender.com. These are
stated in the repository's own documentation, not just here.

Second, why the constraint is the business rather than a limitation. A
commercial analytics company cannot adopt this model, because its pricing
depends on the score staying proprietary — a tool that says "I don't know" is
hostile to that. But auditability is exactly what a compliance team needs,
because it has to justify decisions, and what a protocol gating access needs,
because it has to answer the users it blocks. That is a position incumbents
are structurally unable to copy.

Third, concurrent applications. I have submitted to the Solana Foundation
grant program (confirmed received, awaiting review) and to the Startup
Accelerator Grant from Webacy / DD.xyz via Superteam Earn (confirmed
received). Nothing has been awarded. I am telling you unprompted because you
would ask, and because a project built on not concealing things should not
conceal this.
```

---

## If asked: "How will you use the funding?"

```
Three things, in order.

Production infrastructure: the API is deployed, but on a free tier and the
public Solana RPC. Move it onto a dedicated RPC provider with monitoring and
error tracking — public endpoints rate-limit and commonly disable the
WebSocket log subscriptions the live alert stream depends on.

Verified protocol coverage: independently verify the program IDs and account
layouts for Orca, Magic Eden, and Phantom Swap, so those adapters can be
promoted from "candidate" to "confirmed" with real amount extraction — done
properly, with verification, not by relaxing the standard.

Distribution: get the API in front of teams who need auditable wallet data,
and find out which parts they actually use. I have no users today, and that
is the gap that matters most.
```

---

## If asked: "What is your business model?"

```
Unproven, and I would rather say so than invent a projection.

The candidates I would test first are usage-based API tiers for high-volume
consumers, and sponsored protocol verification — a protocol paying to have
its program layouts independently verified and supported at "confirmed"
status. The code stays MIT licensed either way.

Which of those works is something I expect to learn with you rather than
assert now.
```

---

## Before you press submit

- The videos are the required part. Everything else here is text you paste.
- Colosseum Eternal is **pre-seed investment plus accelerator admission**,
  roughly $250,000, and pre-seed funding normally involves **equity or token
  allocation**. That is materially different from the Solana Foundation
  grant, where the project stays wholly yours. Read their terms.
- Submissions are reviewed first come, first served, and they may schedule an
  interview call. The four likely interview questions and honest answers are
  prepared in `GRANTS/colosseum-video-scripts.md`.
