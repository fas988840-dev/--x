# Grant Reviewer Follow-up — ready replies

When a grant reviewer replies (Solana Foundation, Webacy/DD.xyz, ChainGPT,
Superteam), a fast, honest, specific answer is what converts a submission into
an approval. Copy the relevant block, adjust the greeting, keep every claim
true.

**Rules:** answer within a day. Never overstate — no users yet is fine, say it.
Lead with what a reviewer can verify in two minutes.

---

## A. Short reply (default — use this for most replies)

```
Hi [name], thanks for getting back to me.

Quick recap of FactLedger: a read-only Solana wallet intelligence API built on
one rule — never fabricate data. Any value it can't verify (a price, a fee, a
decoded amount) comes back null, never a guess, and every DEX instruction is
labeled VERIFIED / CANDIDATE / UNKNOWN. Every score ships with the factors and
the exact transactions behind it, so it can be recomputed from any public RPC.

Everything is checkable right now:
- Live API health: https://factledger-api.onrender.com/api/v1/health
- Repo (public, MIT): https://github.com/fas988840-dev/--x
- CI (tests + build): https://github.com/fas988840-dev/--x/actions

Honest current state: it's deployed and open-source, with no users yet — that's
exactly what I'm working on now (public launch + the MCP server for AI agents).

Happy to give a live walkthrough or answer anything. Thanks for considering it.
— Abdullah Al-Anzi
```

---

## B. If they ask "what will you do with the money?"

```
Sized to concrete milestones, not a round number:

1. Dedicated Solana RPC (12 months) — the public endpoint rate-limits and
   disables the WebSocket log subscriptions the live-alert feature needs.
2. Verify Orca + Magic Eden program IDs and account layouts, moving those
   adapters from CANDIDATE to VERIFIED with real amount extraction.
3. Error tracking + uptime monitoring, plus worked API examples and
   integration docs so other Solana builders can adopt it.

Each is a shippable deliverable you can check, not a vague "development" line.
```

## C. If they ask "who's the team / traction?"

```
Solo founder, full time — Abdullah Al-Anzi, based in Saudi Arabia. No users
yet, and I'd rather say that than have you find it. What I can point to is the
code and the deployment: TypeScript strict, no `any`, a determinism test wired
into CI that fails the build if scoring ever stops being reproducible, a live
deployed API, and an MCP server for AI-agent consumers. The next milestone is
the first real users, which the launch now underway is aimed at.
```

## D. If they ask "how is this different from existing tools?"

```
Most wallet-risk tools present a confident number you can't check — if a price
lookup fails, they still return a number; an unverified program is labeled a
known protocol. FactLedger refuses to do that: unknown is returned as null or
UNKNOWN, never collapsed to look more complete. For an AI agent or a security
tool, that turns an unknown into a signal it can branch on instead of trusting
a guess. The honesty is enforced in code and CI, not promised in a README.
```

## E. If they ask for a call / KYC

```
Happy to. I'm on Telegram @abdullhaa11 and email fas988840@gmail.com — send a
time that works and I'll be there. For any KYC/identity step, I'll complete it
directly in your official portal.
```

---

## Disclosure to include if asked about other funding (always be upfront)

```
For transparency: I've also applied to [name the others]. Nothing has been
awarded yet. I mention it unprompted because a project built on not concealing
things shouldn't conceal this.
```

---

## Do / don't
- **Do** reply fast, link the live proof, offer a call.
- **Do** state "no users yet" plainly — it reads as honesty, not weakness.
- **Don't** claim a metric, a user count, or a timeline you can't back up.
- **Don't** promise features as done that are still CANDIDATE/unverified — the
  repo's own docs list those gaps; keep your answers consistent with them.
```
