# Colosseum Eternal — Video Scripts

Two videos are required, each under 3 minutes. Below is a word-for-word
script for each, with timing.

**Every factual claim in these scripts is verifiable.** The test counts are
from CI on `main` and a reviewer can open the latest run at
github.com/fas988840-dev/--x/actions to check them. **If you re-record after
further commits, re-read the current count first** — the figure spoken aloud
has to match the run on screen.

Nothing here claims users, revenue, or partnerships that do not exist — partly
because that would be false, and partly because for *this* product, refusing
to overstate is the demonstration.

---

## Before recording

**Setup**
- Screen recording with your voice. No face needed. No music. No slides
  with stock photos.
- Speak slower than feels natural. Non-native English is completely fine —
  clarity beats accent. Colosseum reviews globally.
- One take is fine. Small stumbles are fine. Do not over-produce.

**Have open in tabs, ready to click:**
1. The GitHub repo
2. The CI run: `github.com/fas988840-dev/--x/actions` — open the latest green run on `main`
3. `src/services/determinism.test.ts`
4. `src/services/instruction-parser.ts`
5. A terminal

**The one thing that decides these videos:** a reviewer watching pitch #180
this month is asking "is this person serious, and is this real?" Specific,
checkable detail answers both. Superlatives answer neither.

---

# VIDEO 1 — Pitch (target 2:40)

### [0:00–0:20] The problem, concretely

> Wallet risk scores are starting to gate real decisions on Solana. Whether
> a wallet can access a protocol. Whether a counterparty is safe to trade
> with. Whether a compliance team clears a transaction.
>
> Today those scores come from one of two places. Commercial APIs that
> return a number from a proprietary model. Or heuristic tools that
> pattern-match program IDs and label the guess as a fact.

### [0:20–0:45] Why that's a real problem, not a stylistic one

> Both have the same flaw: you cannot check them.
>
> If a commercial API says a wallet is high risk, you cannot see which
> transactions drove that, you cannot reproduce it, and you cannot appeal it.
> If you're a compliance officer, you have to defend that decision to a
> regulator. If you're a protocol, you're gating users on a number you can't
> explain.
>
> Nobody tells you what they don't know.

### [0:45–1:15] What FactLedger does

> FactLedger is a read-only Solana wallet intelligence API built on two rules
> enforced in code, not promised in documentation.
>
> One: it never fabricates. If a price lookup fails, the field is null. Not a
> plausible estimate. Null.
>
> Two: it never overstates confidence. Every DEX instruction is classified
> confirmed, candidate, or unknown — and those three states are never
> collapsed to make output look more complete than it is.
>
> Every score cites the exact transactions that produced it. Pull them from
> any public RPC and recompute by hand. You don't have to trust the score.
> You can check it.

### [1:15–1:45] The uncomfortable part — say it plainly

> Let me be straight about where this is, because that's the whole point of
> the product.
>
> It's a solo project. No users yet. It's deployed, but on a free tier and the
> public Solana RPC. And Raydium and Jupiter detection verifies the instruction
> type but not the account layout — so swap amounts come back null and the
> status stays "candidate", not "confirmed."

>
> I could have hidden that. The codebase is built to refuse exactly that
> move, so hiding it in a pitch would make the pitch a lie about the product.

### [1:45–2:15] Why the constraint is the moat

> Here's why I think that constraint is the business, not a limitation.
>
> A commercial analytics company cannot adopt this. Their pricing depends on
> the score being proprietary. A tool that says "I don't know" is hostile to
> that model.
>
> But it is exactly what a compliance team needs, because they have to
> justify the decision. And exactly what a protocol integrating risk gating
> needs, because they have to answer users they block.
>
> Being auditable is a position incumbents structurally can't copy.

### [2:15–2:40] What's real today, and the ask

> What exists right now: 143 tests passing on GitHub's runners — including a
> determinism check that runs on every push. TypeScript strict mode. Thirteen
> REST endpoints, an MCP server, a read-only architecture that never touches
> a private key — deployed and answering right now.
>
> The CI run is linked in the submission. Everything I just said is checkable
> before you talk to me.
>
> I'm applying because the next step — production infrastructure, verified
> protocol coverage, real users — needs more than one person's spare
> capacity. That's what I'd want your help building.

---

# VIDEO 2 — Technical walkthrough (target 2:45)

Screen recording. Talk while clicking. Do not read code aloud line by line —
show the thing, say what it proves.

### [0:00–0:15] Frame it

> I'll show you three things: that the scores are actually deterministic,
> that confidence is actually tiered, and that unknowns actually stay null.
> These are the three claims the product rests on.

### [0:15–0:50] Determinism — show the CI run

*Open the CI run. Scroll to the test output.*

> This is a real run on GitHub's runners. Sixteen test files, 143 tests,
> all passing. Lint clean, type-check clean, build clean.

*Open `src/services/determinism.test.ts`.*

> This is the determinism check. It calls the behavior analyzer, the risk
> assessor, and the intelligence scorer twice each, with a fixed input, and
> asserts the outputs are exactly equal. Not close — exactly, field by field.
>
> It runs on every push. If a change ever makes scoring non-deterministic,
> the build fails. The core claim is enforced by CI, not by a README.

### [0:50–1:15] Show the honesty inside the test itself

*Scroll to the header comment, the "Scope note" paragraph.*

> I want to point at this comment specifically. It says this test runs both
> calls in the same process, and that if you want the stronger cross-process
> guarantee, you'd run the file twice and diff a snapshot.
>
> That's a limitation of my own test, written down in my own repo, where
> nobody would have caught it. That's the standard I'm holding the whole
> codebase to.

### [1:15–1:50] Confidence tiering

*Open `src/services/instruction-parser.ts` / `dex-registry.ts`.*

> Every instruction gets one of three statuses. Confirmed means a verified
> adapter decoded it. Candidate means it looks like a swap but the layout
> isn't verified. Unknown means we don't know.
>
> Raydium and Jupiter are registered with program IDs verified against each
> project's own docs. But both decoders only check the instruction
> discriminator. The account layout needed to extract amounts isn't
> independently verified — so they return candidate, with mints and amounts
> null.
>
> Upgrading those to "confirmed" would take one line and make the output look
> much better. That line is the one thing this codebase won't do.

### [1:50–2:20] Nulls and precision

*Open `price-provider.ts`, then `token-balance-delta.ts`.*

> Price lookups return null on any failure — rate limit, unlisted token,
> network error. There is no fallback estimate anywhere in the path.
>
> And amounts are strings, never JavaScript numbers, because lamport values
> exceed what a float holds safely. This function returns null rather than a
> lossy value when an amount is too large. Silently wrong is worse than
> absent.

### [2:20–2:45] Close

> The architecture is a linear pipeline: RPC client, transaction retriever,
> instruction parser, behavior analyzer, then two scorers that each return
> named factors and human-readable reasoning alongside the number.
>
> Read-only throughout. It calls read methods on a Solana connection and
> nothing else. No key material, no signing, nothing to steal.
>
> All of it is public. Clone it, run `npm test`, and check every number I
> just gave you.

---

## What NOT to say

Cut these if they creep in while recording:

- "Revolutionary", "game-changing", "the future of" — reviewers discount them
- Any user, revenue, or partnership number (there are none)
- Market-size figures you haven't personally verified
- "We" when you mean "I" — solo is fine; pretending to be a team is not
- Any promise about what the score *predicts*. It describes past on-chain
  behavior. It is not financial advice, and the API says so in every response.

## What they'll likely probe in the interview

Prepare honest answers now:

1. **"You have no users. Why fund this?"** — True. Say what you'd do first to
   change it, and be concrete about who you'd approach.
2. **"What stops Helius or a bigger team building this?"** — Nothing
   technical. Your answer is that the honesty constraint is business-hostile
   to their models, and that the code is MIT so the ecosystem wins either way.
3. **"How do you make money?"** — Don't invent a model. Say what you'd test
   first (API tiers, sponsored protocol verification) and that it's unproven.
4. **"Why should this be a company rather than a library?"** — This is the
   hardest one for an accelerator. Have a real answer or say you're still
   working it out. Do not bluff it.

## Reminder before submitting

Colosseum Eternal is pre-seed **investment** plus accelerator admission —
roughly $250,000, normally involving equity or token allocation. That is
materially different from the Solana Foundation grant already submitted,
where the project stays wholly owned. Read their terms, and disclose the
concurrent applications if they ask — they do ask.
