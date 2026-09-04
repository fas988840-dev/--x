# FactLedger — Launch Kit (get your first users)

Everything you need to announce FactLedger and get people to try it. Copy,
paste, post. Keep every claim honest — it's the whole brand.

**One rule for the launch:** say only what's true today. It's open-source,
read-only, deployed, and evidence-backed. It has **no users yet** — that's fine;
you're fixing that now. Don't claim traction you don't have.

---

## Try-it-in-30-seconds (put this everywhere)

Public, no key needed:
```bash
# Is it alive?
curl https://factledger-api.onrender.com/api/v1/health

# What protocols does it verify?
curl https://factledger-api.onrender.com/api/v1/protocols
```

> Note: the wallet endpoints (`/intelligence`, `/risk`, `/evidence`) are
> behind an API key on the live instance. For an open public demo, either run
> an instance with `API_KEYS` unset (open + rate-limited) or hand testers a
> key. Decide this before you post — the first thing people do is try it.

First request after idle can take ~30s (Render free-tier cold start) — normal.

---

## X / Twitter (post from @aamm123220)

**Launch post:**
```
Shipped FactLedger 🔍 — a read-only Solana wallet intelligence API that never fabricates data.

Every value is read from chain or returned as "unknown" — never guessed.
Deterministic risk + intelligence scores, each with a full evidence trail.

Open-source (MIT). Live now 👇
https://github.com/fas988840-dev/--x

@solana @SuperteamDAO
```

**Follow-up (thread):**
```
Why it's different: most wallet tools show you numbers you can't check. If a price lookup fails, they return a number anyway. FactLedger returns null instead.

Every DEX instruction is labeled VERIFIED / CANDIDATE / UNKNOWN — never collapsed to look more complete than it is.
```

---

## Reddit (r/solana, r/solanadev)

**Title:**
```
I built an open-source Solana wallet intelligence API that never fabricates data (returns "unknown" instead of guessing)
```
**Body:**
```
FactLedger turns on-chain data into a wallet intelligence score, a risk score,
and an evidence trail — and it's built on one rule: never fabricate. If a
price, fee, or decoded amount is unknown, it returns null, not a plausible
number. Every DEX instruction is labeled VERIFIED / CANDIDATE / UNKNOWN.

It's read-only (no keys, no signing), MIT-licensed, and deployed. There's also
an MCP server so AI agents can consume it.

I'd genuinely like feedback — especially on whether the "honest unknowns"
approach is useful to you, or just extra friction.

Repo: https://github.com/fas988840-dev/--x
Live: https://factledger-api.onrender.com/api/v1/health
```

---

## Discord (Solana Tech, Superteam, LamportDAO)

Short, no spam — one message, then answer questions:
```
Built a small open-source thing: FactLedger, a read-only Solana wallet
intelligence API. Its one rule is it never guesses — unknown values come back
as null, and every DEX instruction is labeled verified/candidate/unknown.
There's an MCP server for AI agents too. Feedback welcome 🙏
Repo: https://github.com/fas988840-dev/--x
```

---

## For AI-agent builders (the MCP angle — your best niche)

FactLedger ships an MCP server, so an agent can pull evidence-backed wallet
data instead of guessing. Pitch line:
```
If your Solana agent acts on wallet data, it needs to know which fields were
actually verified. FactLedger's MCP server labels every value's confidence, so
your agent can branch on "unknown" instead of trusting a guess.
```
Point them at the repo's MCP section (`src/mcp/`) and `npm run mcp`.

---

## Where to post (in order)

1. **X** — launch post + thread, tag @solana @SuperteamDAO.
2. **Superteam** community (you're already a member) — share in the build/showcase channel.
3. **r/solanadev** and **r/solana**.
4. **Solana Tech Discord**, **LamportDAO**, MCP / AI-agent communities.
5. **Product-style directories** later (once there are users to show).

---

## What to do when someone replies

- Answer fast and honestly. If they hit the cold-start delay or the API-key
  gate, explain it plainly.
- Ask every tester one question: *"what would make this useful to you?"* —
  those answers are your real roadmap.
- Log who tried it. Even 10 real testers is the difference between "$0 idea"
  and "something with traction."

---

**Honest reminder:** the goal of the launch isn't applause — it's the first
handful of people who actually use it and tell you why they would (or
wouldn't) again. That feedback is worth more than any grant.
