# Colosseum Eternal — GO (execute from top, iPad-friendly)

Everything for the Colosseum submission is written and ready. The only thing
no AI can do for you is **record the video with your own voice** — this guide
makes that a 10-minute job on an iPad, no desktop or code screen needed.

Full text is in `colosseum-submission-fields.md`; the detailed 2-video desktop
scripts are in `colosseum-video-scripts.md`. Use those if you have a desktop.
If you only have the iPad, use the single short video below — it's enough.

---

## Step 1 — Record ONE short video (~90 seconds, iPad)

You don't need to show code. Screen-record your iPad browser (or just talk to
the camera) while you show two live things:

**What to have open:** the live API health page and the GitHub repo.

**Say this, slowly (word-for-word is fine):**
```
Hi, I'm Abdullah, and this is FactLedger — a read-only Solana wallet
intelligence API built on one rule: it never fabricates data.

Most wallet-risk tools give you a number you can't check. If a price lookup
fails, they still return a number. FactLedger returns "null" instead — and
every DEX instruction is labeled verified, candidate, or unknown, never
collapsed to look more complete than it is.

[show https://factledger-api.onrender.com/api/v1/health on screen]
Here's the live API responding right now.

[show the GitHub repo]
It's fully open-source and MIT-licensed. Every score cites the exact
transactions behind it, so anyone can recompute it from a public RPC. There's
a determinism test in CI that fails the build if scoring ever stops being
reproducible.

Honest status: it's deployed, solo-built, with no users yet — that's exactly
what I'm working on now. I'm applying to Colosseum to take it from a solid
open-source tool to something teams actually rely on. Thank you.
```

**Recording tips (iPad):**
- Control Center → Screen Recording (hold the icon → turn Microphone ON), then
  open your browser and talk while you tap between the two tabs.
- One take is fine. Small stumbles are fine. Speak slower than feels natural.
- No music, no stock photos, no face needed.

---

## Step 2 — Put the video where reviewers can open it
- Upload to **YouTube as _Unlisted_** (NOT Private — reviewers can't open Private).
- Or upload directly if the Colosseum form allows a file upload.
- Title: `FactLedger — Pitch`.

---

## Step 3 — Fill the form at colosseum.com
Copy each block from `colosseum-submission-fields.md`:
- Product name → `FactLedger`
- Short + long descriptions → (ready in that file)
- Team background → (ready)
- GitHub → `https://github.com/fas988840-dev/--x`
- Video → your Unlisted link
- "Anything else" + "use of funding" + "business model" → (all ready)

---

## Step 4 — Before you press submit (read this)
- Colosseum Eternal is **pre-seed investment + accelerator admission (~$250k)**,
  and pre-seed normally means **equity or token allocation** — unlike the
  Solana Foundation grant where the project stays wholly yours. **Read their
  terms** and decide you're OK with that before submitting.
- Eternal is a **4-week build sprint**: you start it, post a weekly update, and
  submit at the end of week 4. So this "submission" also commits you to
  shipping visibly for four weeks — which is good, it builds the traction the
  other grants want.

---

## Step 5 — If they schedule an interview
Four questions they'll likely ask, with honest answers, are in
`colosseum-video-scripts.md` ("What they'll likely probe"). Read them once
before any call. The hardest one — *"why a company, not a library?"* — answer
honestly or say you're still working it out. Never bluff it.

---

## Honesty guardrails (same as the whole project)
- No users / revenue / partnerships claimed — there are none yet.
- Don't upgrade "candidate" to "confirmed" in the pitch; the repo lists the gaps.
- "Solo" is fine — say "I", never "we".
- The number describes past on-chain behavior; it is not financial advice.

---

**Bottom line:** the writing is done. Record the 90-second video (Step 1),
make it Unlisted (Step 2), paste the fields (Step 3), read the terms (Step 4),
submit. That's the whole thing.
