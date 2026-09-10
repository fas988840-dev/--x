# CLAUDE.md — JONARAI

This file provides guidance to Claude Code (claude.ai/code) when working
inside the `jonarai/` subtree of this repository.

> ⚠️ **JONARAI is a separate product from FactLedger.** The repo-root
> `CLAUDE.md` (one level up) describes FactLedger, a Solana wallet analysis
> service. Do not mix the two. Anything under `jonarai/` follows **this**
> file's rules, not the root's.

---

## 1. What JONARAI is

**JONARAI** is an SPX / SPXW **0DTE options trading intelligence platform**.
Its job is to answer:

1. **WHEN** to trade.
2. **WHETHER** to trade.
3. **WHICH** contract has the best executable setup.
4. **WHERE** to enter / where the thesis is invalid / where to take profit.
5. **WHEN** to move / trail the stop, and when to exit early.

It is **not** an execution broker. It is intelligence + confidence scoring +
trade-management guidance. The default answer is **`NO TRADE`**.

---

## 2. Sources of truth (READ BEFORE EDITING ANYTHING HERE)

| File | Role |
|------|------|
| `docs/JONARAI_MASTER_SPEC.md` | Index of every spec section, marks RECEIVED / AWAITING |
| `docs/JONARAI_TIME_ENTRY_MANAGEMENT_SPEC.md` | Time / Entry / Trade-Management core (24 sections) — **BINDING** |
| `docs/JONARAI_DATA_MASTER.md` | Every data field, source, and licensing (currently placeholder) |
| `docs/JONARAI_BUILD_ROADMAP.md` | Phase A → Z order and per-phase DoD |

If a spec file above conflicts with what a task or a code comment suggests,
**the spec wins**. Bring the conflict to the user; do not silently choose.

---

## 3. Division of labor (frozen)

| Role | Owns | Does NOT do |
|------|------|-------------|
| **ChatGPT (Architect)** | Product · Trading logic · Data Master · MTF rules · Options logic · Scoring formulas · Contract selection · Risk logic · Testing methodology | Write production code · Merge PRs |
| **Claude (Implementer — you)** | Backend · Frontend · Database · APIs · WebSockets · Infrastructure · Tests · Refactoring · Documentation · Deployment scripts | Change trading logic on your own · Open Phase N+1 before Phase N is signed off · Collapse the entry pipeline · Invent data field names |
| **User (Owner)** | Accounts · API subscriptions · Cloud/GitHub · Commercial licenses · Product decisions · Final approval per phase | — |

**Handshake:** No phase advances without an explicit `"A ✅"`, `"B ✅"`, …
from the user. If unsure whether the current phase is signed off, ask.

---

## 4. Design guardrails (from Time/Entry Spec §24) — NON-NEGOTIABLE

These are enforcement rules on the implementer. Violating any of them is a
spec violation, not a stylistic choice.

1. **Never** collapse `score >= 93` into a direct `BUY` decision. The full
   pipeline is:
   ```
   Score → Mandatory Gates → Time Confirmation → Contract Confirmation
        → Entry → Time-to-Prove → Dynamic Profit Lock → Reversal/Exit Monitoring
   ```
2. **Never** present the score as a probability of profit. It is a
   selectivity score; calibration determines its empirical meaning.
3. **Never** hardcode weights that ChatGPT has not signed off on. All
   weights are configurable.
4. **Never** allow entry when critical data is stale, missing, or
   inconsistent — regardless of score.
5. **Never** widen a stop after profit protection activates.
6. **Never** merge `SPX_INVALIDATION_LEVEL` with `OPTION_EXECUTION_STOP` —
   they are separate signals.
7. **Prefer `NO TRADE` over a marginal trade.** The engine's default answer
   is silence.
8. **Every scoring output must carry `reasoning[]`** — a human-readable list
   of the factors that drove the score.
9. **Deterministic scoring** — the same inputs must always produce the same
   score. No hidden randomness. No LLM-in-the-loop for the score itself.
10. **No live IBKR execution before paper-trading calibration** — see
    Master Spec Phase Y/Z.

---

## 5. Phase gates

- **Current phase:** A (scaffold + doc placeholders).
- **Phase B (Data Master) is blocked** on:
  1. Architect delivering the Data Master content (fields, sources, licensing).
  2. Explicit user approval of Phase A (`"A ✅"`).

Do not start writing DB migrations, provider adapters, or engine code until
both of the above are true.

---

## 6. What NOT to add during Phase A

Adding any of these during Phase A locks in a decision the architect has not
made:

- `package.json`, `tsconfig.json`, `pyproject.toml`, `Cargo.toml`, …
  (tech stack not decided)
- CI workflows (`.github/workflows/*.yml`)
- Source code in `backend/`, `frontend/`, `database/`, `analytics/`,
  `tests/`, `infrastructure/`
- `LICENSE`

If a task asks for one of these before its phase, that's a change request
for the user — surface it, don't just do it.

---

## 7. Repo-layout note (temporary)

JONARAI currently lives as a **subfolder inside `fas988840-dev/--x`**
(because Claude's GitHub App cannot create new repos, and the user has not
yet supplied the path of a standalone `jonarai` repo). When that path
arrives:

- Migrate with `git mv` (or `git subtree split`) — history preserved.
- Move `jonarai/CLAUDE.md` to the new repo root.
- Update the "sources of truth" table above with any new paths.
- Nothing else about how the code is organized changes.

---

## 8. Global non-negotiables (repeat from Master Spec §2)

- Score is a selectivity score, **not** a probability of profit.
- `NO TRADE` is a first-class output.
- Every scored output is deterministic and carries `reasoning[]`.
- Read-only until proven: no live broker writes before paper-trading
  calibration + kill-switch / risk-limits layer.
- Data integrity first: stale / missing / disagreeing feeds → entries disabled.
- No LLM in the scoring loop. LLMs (if any) only rephrase already-computed
  deterministic facts, and never introduce new numbers.
- Every user-facing output carries a "not financial advice" disclaimer.
