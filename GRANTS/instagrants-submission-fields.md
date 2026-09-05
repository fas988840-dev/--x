# Superteam Instagrants — Ready-to-Paste Submission

Apply through **https://earn.superteam.fun/grants/** (find the Instagrants
listing open to your region).

**Status updated 2026-09-05: not submitted.** The founder reports that Saudi
Arabia is not accepted and asked to stop eligibility research. Do not use a
regional listing that excludes the founder. The historical statement that
Saudi eligibility was confirmed had no attached evidence and is superseded.
Amounts and review times vary by actual listing; there is no guaranteed
48-hour decision. The $8,000 below is a proposed budget, not an award.

The live API health endpoint answered HTTP 200 on 2026-09-05, while the price
provider was reported as degraded. This is a liveness check, not verification
of all protected endpoints or integrations.

---

## What you are asking for

```
$8,000 USDC
```

Sized to the milestones below, not to the ceiling. Instagrants are small and
fast; a costed ask reads better than a round maximum.

---

## Project name

```
FactLedger
```

## One-line description

```
A read-only Solana API whose wallet and token findings can be independently
recomputed from chain — it returns null rather than an estimate, and never
reports a token as safe.
```

## What it does

```
Wallet risk scores increasingly gate real decisions on Solana: protocol
access, counterparty trust, compliance review. Today those scores come from
proprietary models that cannot be audited, or from heuristic tools that
pattern-match program IDs and present the guess as a fact. Neither tells you
what it does not know.

FactLedger is a read-only Solana API built on two rules enforced in code
rather than promised in documentation. It never fabricates: any value it
cannot verify — a price, a fee, a decoded swap amount — comes back null, never
as a plausible estimate. And it never overstates confidence: every DEX
instruction is classified confirmed, candidate or unknown, and those states are
never collapsed to make output look more complete.

Every score ships with the named factors that produced it and the specific
transactions it read, so anyone can pull those from a public RPC and recompute
it by hand.
```

## The specific problem it solves for Solana builders

```
A builder integrating wallet risk data today has no way to tell which fields
were actually checked. A price that quietly failed comes back as a number. An
unverified program is labelled a known protocol. So the builder either trusts
everything or trusts nothing, and both are wrong.

FactLedger gives every field a confidence state, so a caller can branch on it:
CANDIDATE or null is an explicit instruction not to proceed as if the value
were known. That is the difference between a data source you can build
defensively on and one you cannot.

Concretely, GET /api/v1/token/:mint/security answers the question every agent
and trading tool asks before touching a token — can the issuer rug me? It
reads the mint account and reports whether mint authority is still active
(unlimited new supply can be minted) and whether freeze authority is still
active (any holder's balance can be frozen and made unsellable).

It deliberately never answers "safe". Renounced authorities do not rule out a
rug — the deployer may hold most of the supply, liquidity may be unlocked, a
Token-2022 transfer hook may block selling. The cleanest result is
NO_FINDINGS_IN_CHECKED_SET, and every response carries a notChecked list that
is never empty, so a short findings list cannot be misread as an all-clear.
```

## Proof of work

```
Repository:  https://github.com/fas988840-dev/--x     (public, MIT)
Live API:    https://factledger-api.onrender.com/api/v1/health
CI:          https://github.com/fas988840-dev/--x/actions

Deployed and answering. 219 tests pass in the local verification run on 2026-09-05, including a
determinism check that calls each scoring function twice with fixed input and
asserts exact equality — the build fails if scoring ever stops being
reproducible.

TypeScript strict mode for the core build, REST endpoints, an MCP server for
AI clients, and a read-only architecture that never requests or stores a
private key.

Everything above is checkable before you reply.
```

## What the money is for

```
$3,000  Dedicated Solana RPC provider for 12 months. The public endpoint
        rate-limits and commonly disables the WebSocket log subscriptions the
        live alert stream depends on, which is the main thing holding that
        feature back from real use.

$3,000  Verify Orca and Magic Eden program IDs and account layouts, so those
        adapters move from CANDIDATE to VERIFIED with real amount extraction —
        done by verifying the layout, not by relaxing the label.

$2,000  Error tracking and uptime monitoring, plus worked API examples and
        integration docs so other Solana builders can actually adopt it.
```

## Team

```
Solo developer, full time. Abdullah Al-Anzi, based in Saudi Arabia.

No users yet, and I would rather say that than have you find it. What I can
point to is the code and the deployment: both are public, and every number in
this application can be checked in a few minutes.
```

## Anything else

```
Honest gaps, stated because the project's whole claim is that it states them.
Raydium and Jupiter detection verifies the instruction type but not the
account layout, so swap amounts stay null and status stays CANDIDATE. The live
WebSocket alert stream is unit-tested but not yet exercised against a real RPC
subscription. CoinGecko remains the default price provider. Pyth is implemented and locally tested, with real-key activation and production deployment still pending.

Concurrent applications reported submitted: Solana Foundation, Webacy / DD.xyz,
ChainGPT and Superteam Solana Summit. Colosseum is in progress. These statuses
are not cash award confirmations. Proposed costs will be reconciled across
programmes so the same deliverable is not funded twice.
```

---

## Contact

```
Email:   fas988840@gmail.com
X:       @aamm123220
Wallet:  EWEY53t7rXLTQ964EhuAXHAMV9WoEkxn4h4fYB1ZRFNM
```
