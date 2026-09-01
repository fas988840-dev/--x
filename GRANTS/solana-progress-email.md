# Solana Foundation — progress update email

## How to send it

**Reply to the existing confirmation email** — the one titled *"Solana Grant
Submission Confirmation"* from Solana Grants. Do not start a new message to
`grants@solana.foundation`.

Replying keeps this attached to the application already on file. A fresh
email to the grants inbox from someone who already applied reads like a second
application, which helps nobody.

## Before sending — one check

Open `https://factledger-api.onrender.com/api/v1/health` and confirm it
returns `{"status":"ok",...}`. The email is built around that URL working. On
Render's free tier the first request after idle can take ~30 seconds.

Also confirm the protected routes return `401` rather than data — if
`API_KEYS` did not take effect, the API is open to anyone and that needs
fixing before you point a funder at it.

## What this email is, and is not

It reports that the API is deployed. It does **not** claim Milestone 1 is
complete, because it is not:

```
① public URL                          ← done
② dedicated RPC provider              ← not done
③ error tracking and monitoring       ← not done
④ deployment docs and API examples    ← partly
```

And it asks for nothing. The grant has not been approved, so there is no
payment schedule to draw against. The value of sending it is that an
applicant who ships before being funded is a different proposition from a file
sitting in a queue.

Keep it short. They review a lot of these.

---

## Subject

```
FactLedger — API now deployed and public
```

## Body

```
Hello,

Following up on my grant application for FactLedger with one concrete update:
the API is now deployed and publicly reachable.

  Live:  https://factledger-api.onrender.com/api/v1/health
  Code:  https://github.com/fas988840-dev/--x   (public, MIT)
  CI:    https://github.com/fas988840-dev/--x/actions

That covers the first part of Milestone 1 as proposed — a public URL. The
remaining parts of that milestone, a dedicated RPC provider and error and
uptime monitoring, are not done yet, and I am not claiming otherwise.

Two things have also changed since I applied, both worth a line:

The repository is now MIT licensed. It stated a proprietary licence when I
submitted, which contradicted the application, and the application was
correct — the project's claim is that its scores can be independently
recomputed, and a licence forbidding anyone from running the code makes that
claim unexercisable.

There is a new endpoint, GET /api/v1/token/:mint/security, which reads a
token's mint account and reports whether mint authority is still active
(unlimited new supply can be minted) or freeze authority is still active (any
holder's balance can be frozen). It deliberately never answers "safe":
renounced authorities do not rule out a rug, so the cleanest result it can
give is "no findings among the checks performed", accompanied by an explicit
list of the risks it did not examine. That restraint is the point of the
project, applied to a new surface.

151 tests pass on GitHub's runners, including a determinism check that calls
each scoring function twice with identical input and asserts exact equality —
the build fails if scoring ever stops being reproducible.

No action needed from you. I know the review runs to about a month and I am
not asking to shortcut it; I just wanted the record to reflect that the work
is moving.

Best regards,
Abdullah Al-Anzi
fas988840@gmail.com
```

---

## If they reply asking for more

Do not re-pitch. Answer the question asked, link the specific file or
endpoint, and keep it to a few lines. The repository is the argument.
