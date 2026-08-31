# FactLedger — Grant Submission Record

**Last updated**: August 31, 2026

This file records what was actually submitted, with the evidence for each
claim. Entries without evidence are marked as such rather than asserted.
This mirrors the project's own rule (see `CLAUDE.md`): a claim that cannot
be independently verified is not written down as fact.

---

## Submissions

### 1. Startup Accelerator Grant — Webacy / DD.xyz (via Superteam Earn)

| Field | Value |
|---|---|
| Listing | "Startup Accelerator Grant", sponsored by Webacy, grant by DD.xyz |
| Platform | earn.superteam.fun (listing) → `hy35k9ea.typeform.com` (form) |
| Stated award | Up to $10,000 USD |
| Status | **Submitted** |
| Evidence | Typeform completion screen: "Thank you for applying! We will get back to you shortly." with Webacy branding and promo code `AINSIDER1872` (3 months Webacy Pro) |

**Note on a possible duplicate**: a second identical confirmation text was
observed. Because the text is byte-identical to the first, it cannot be
distinguished from a re-display of the same submission. Whether one or two
submissions of this same form exist is **unknown**. No second, different
grant program was confirmed.

### 2. Solana Foundation — $25,000

| Field | Value |
|---|---|
| Status | **Reported submitted in an earlier session** |
| Evidence | Not independently verifiable from this session. No confirmation screen or email was observed here. |

Treat as unconfirmed until the confirmation email in `fas988840@gmail.com`
is checked directly.

### 3. Colosseum Eternal — NOT SUBMITTED

No Colosseum application was observed being filled out or confirmed.
Earlier drafts of this file claimed a confirmed $15,000 Colosseum grant.
**That claim was incorrect and has been removed.**

If you want to apply: https://colosseum.org — answers are prepared in
`COPY_PASTE_ANSWERS.txt` and `docs/send-grants.html`.

### 4. ChainGPT Research — NOT SUBMITTED

`chaingpt.org/grants` returned 404 when checked. No application filed.

---

## Honest totals

| Item | Amount |
|---|---|
| Confirmed submitted (Webacy/DD.xyz, award **up to** $10,000) | up to $10,000 |
| Reported submitted, unverified here (Solana Foundation) | $25,000 |
| **Awarded to date** | **$0 — no grant has been approved** |

"Up to $10,000" is the listing's stated ceiling, not an amount requested,
promised, or received.

---

## Bonus actually received

- Promo code `AINSIDER1872` — 3 months Webacy Pro, redeemable at Stripe
  checkout. This is the only thing of value confirmed received so far.

---

## Project state

Claims below are attributed to their source. Nothing here was verified in
the session that wrote this file — `npm install` fails in that environment
(npm registry returns 403), so tests, lint, type-check, and the Docker
build could not be run locally.

| Claim | Source | Verified here? |
|---|---|---|
| 133 tests pass | GitHub Actions CI (`.github/workflows/ci.yml`) | No — check the CI badge / Actions tab |
| TypeScript strict, no lint errors | Same CI run | No |
| Docker image builds | `Dockerfile` present; build not run here | No |
| 12 REST endpoints implemented | Readable in `src/api/server.ts` | Code present, not exercised |
| Read-only architecture | Enforced in code, documented in `CLAUDE.md` | Design invariant |

**To verify any of the above yourself**, open the Actions tab on the
repository and read the latest run, or clone and run `npm ci && npm test`
somewhere with npm registry access.

---

## Repository

- Owner/name as seen on GitHub: `fas988840-dev/--x`
- Older documents in this repo link to `fas988840-dev/PROJECT-x`. If that
  redirects, both work; if it does not, those links are broken and need
  updating. **Not verified.**
- Repository was **archived** on Aug 31, 2026 (read-only). It must be
  unarchived before anything can be pushed.

---

## What to do next

1. **Unarchive the repository** — Settings → Danger Zone → Unarchive.
2. **Check `fas988840@gmail.com`** for the Solana Foundation confirmation
   and update the table above with what you actually find.
3. **Decide on Colosseum** — it was never submitted. Apply or drop it.
4. **Fix the repo links** if `PROJECT-x` does not redirect to `--x`.
5. Wait for a response on the Webacy/DD.xyz application.

---

**Contact**: fas988840@gmail.com · Solana wallet:
`EWEY53t7rXLTQ964EhuAXHAMV9WoEkxn4h4fYB1ZRFNM`
