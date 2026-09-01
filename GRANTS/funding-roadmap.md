# Funding roadmap

One place to work from. Ordered by what unlocks what, not by calendar —
every tier below the first is gated on the same two things, and a date-based
plan hides that.

Each programme is marked **verified** (checked against the programme's own
pages) or **unverified** (plausible, not confirmed — check before investing
time in it).

---

## The gate

Everything past tier 1 needs one or both of:

- **A deployed, reachable API.** Not a repository — a URL a reviewer can call.
- **Users.** Even a handful of real ones.

The API is now deployed; users are not. That is not six independent options
waiting — it is one door with six rooms behind it, and the door is half open.

**Current state:** repository public and MIT, CI green (151 tests), the API
deployed at https://factledger-api.onrender.com, no users yet.

That clears the first half of the gate. **Users are what remain.**

---

## Tier 1 — Superteam Instagrants ✅ verified

| | |
|---|---|
| Amount | ~$500 – $10,000, USDC |
| Speed | Decision in ~48 hours; application takes ~15 minutes |
| Dilution | None — a grant, not investment |
| Needs | Open source ✅ · working prototype ✅ · deployment ✅ |

**Fastest money available, and the only tier reachable in days.**

⚠️ **Check eligibility first.** The programme's own material describes
emerging markets — India, Southeast Asia, Eastern Europe, Africa. Saudi
Arabia is not named. Ask the relevant Superteam chapter before spending time
on the application; a rejection on geography costs nothing but finding out
after writing it does.

Their wording ties support to deploying on Mainnet — now satisfied. Submission
text is ready in `instagrants-submission-fields.md`.

---

## Tier 2 — Protocol grants ⚠️ unverified

Pyth, Kamino, Jito and similar. Amounts and timelines in the source plan
($5k–$50k, 2–4 weeks) are **not confirmed** — verify each programme exists
and is open before planning around it.

**The Pyth one is the standout, and not only for the money.**

FactLedger's price provider is CoinGecko's free API. It returns `null` often
— rate limits, unlisted tokens — and that is a documented product gap. But
the deeper problem is philosophical: the project's whole claim is that every
number can be recomputed from chain, and **CoinGecko prices cannot be. They
are an off-chain HTTP call no reviewer can verify or reproduce.** The weakest
link in the pipeline is the one that contradicts the thesis.

Pyth is an on-chain oracle. A Pyth price has a slot, can be cited, and can be
checked by anyone. Integrating it would:

1. Close a real product gap (prices stop being null so often)
2. Remove the inconsistency at the centre of the pitch
3. Qualify for a Pyth grant

Three returns from one piece of work. **The best single item in this plan.**

**Why it is not built yet:** it needs `@pythnetwork/client` or hand-parsing
Pyth's account layout. `npm install` does not work in the environment these
docs were written in, so a new dependency cannot be installed, compiled, or
tested here — and hand-writing the account layout from memory is exactly the
guessing this codebase forbids. Build it somewhere `npm install` works,
against the real SDK, with tests.

---

## Tier 3 — Solana Foundation ✅ verified (already submitted)

Submitted and confirmed by email; they state a response within one month of
submission. The proposal requests $25,000 across three milestones.

Nothing to do but wait — and note that **Milestone 1 has four parts**, of
which deploying is one:

```
① public URL          ← deployment does this
② dedicated RPC provider
③ error tracking and uptime monitoring
④ deployment docs and worked API examples
```

Deploying is not "Milestone 1 complete". Claiming it is would repeat the
mistake this repository spent a day correcting.

---

## Tier 4 — Colosseum Eternal ✅ verified

Not a $15,000 grant and not a form. It is a **four-week development sprint**:
start it from the Eternal dashboard, post a weekly update with a video, and
submit at the end of week four. The prize is ~$250,000 pre-seed **plus
accelerator admission** — investment, normally involving equity or token
allocation, unlike every grant above.

The sprint is worth doing on its own terms: four weeks of documented shipping
closes the deployment and users gap that blocks everything else. Videos and
submission text are already prepared (`colosseum-video-scripts.md`,
`colosseum-submission-fields.md`).

The source plan also lists hackathon prizes of $10k–$50k. **Unverified** —
those attach to scheduled hackathons, not to Eternal.

---

## Tier 5 — Global accelerators ⚠️ unverified · not reachable yet

Alliance DAO, Outlier Ventures. The source plan lists two entry requirements:
design partners among agent developers, and **a proven x402 micropayment
revenue model**.

There is no revenue model in this codebase, x402 or otherwise. See
"Cancelled" below.

---

## Tier 6 — Tier-1 VCs ⚠️ far off

Multicoin, RockawayX and similar want live query volume, an SDK in real use,
and a full-time team. None exists. Listing them as a horizon is fine;
planning around them now is not.

---

## Cancelled — and why

Four items in the source plan describe things that do not exist. Each is
listed here so it does not quietly return to a pitch.

### ❌ x402 micropayment gateway

The drafted `X402PaymentGateway.verifyPaymentHeader` splits the header and
returns `status: 'PAID'` without looking anything up. `x402 anything` is
accepted, an empty signature is accepted, and the same signature replays
forever. Deployed as monetisation it would collect nothing while reporting
success.

A real one is buildable — look up the transaction, check the amount and
recipient, reject reuse — but it is **not** a prerequisite for anything
currently in reach, and tier 5 is not reachable regardless. Cancelled until
there is a reason to build it properly.

### ❌ "5-agent suite"

`src/agents/core_agents.ts` exports **seven**. The number has appeared as
five in three separate drafts; it is wrong every time.

### ❌ "Interactive Playground Demo"

Does not exist. Listed as a Colosseum requirement in the source plan.

### ❌ "SDK integrated and used by live AI projects"

There is an MCP server, which is not an SDK, and nothing external uses it.

### ❌ Encrypted payload / AES-256-GCM

Proposed to protect "agent memory from scraping". The API serves **public
blockchain data** — there is nothing confidential to encrypt, TLS already
covers transit, and holding a secret key would break the project's
no-secrets invariant, which is itself a stated security feature.

---

## The order that actually works

```
done       deploy the API                    https://factledger-api.onrender.com
now        Superteam Instagrants             text ready · decision in 48h
now        ChainGPT Web3 AI grant            text ready · verify the tier ceiling first
2 weeks    Pyth integration                  needs a working npm install
then       Pyth grant                        with the integration as evidence
4 weeks    Colosseum sprint                  starts strong if already deployed
waiting    Solana Foundation                 response within a month of submission
waiting    Webacy / DD.xyz                   submitted, no stated timeline
```

**Awarded to date: $0.** Two applications confirmed submitted, none decided.

Deployment was the gate and it is cleared. Instagrants is now the fastest
remaining move — a decision in about 48 hours, on text that is already
written. Users are what the rest of the ladder still waits on.
