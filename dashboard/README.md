# FactLedger Dashboard

Read-only web UI over the FactLedger REST API (`../src`). This app has
**no direct blockchain access and no database of its own** — every page
just calls the existing API and renders whatever it returns, including
its `UNKNOWN`/error states honestly.

⚠️ **Not yet verified to actually build/run.** Written against Next.js
14 (App Router) from training knowledge — the npm registry was
unreachable from the sandbox that wrote it, so `npm install` was never
actually run here. Treat any build error as likely dependency-version
drift to fix locally, not a sign the approach is wrong.

## Run it

```bash
# 1. Start the FactLedger API first (from the repo root)
cd ..
npm install
npm run dev   # listens on :3000 by default

# 2. In a second terminal, start the dashboard
cd dashboard
npm install
cp .env.example .env.local   # edit FACTLEDGER_API_URL/FACTLEDGER_API_KEY if needed
npm run dev                  # listens on :3001 (Next.js picks the next free port)
```

Open the URL Next.js prints (typically `http://localhost:3001`).

## Deploying to Vercel

This app lives in a subdirectory of a repo whose root is a different
project (the Express API). **The Vercel project's Root Directory must
be set to `dashboard`** — Settings → Build and Deployment → Root
Directory. This is not just the cleaner option; it is confirmed
structurally required, below.

Two UI pitfalls worth naming, both hit while setting this exact field
in the Vercel dashboard on mobile Safari:

- **Page auto-translate can corrupt the value you type.** If the
  browser has translated the settings page, typing `dashboard` into
  Root Directory can come back displayed (and saved) as the *translated
  word* for "dashboard" in whatever language the page was translated
  to, not the literal string Vercel needs. Turn off page translation
  (or confirm "Show Original") before typing into this field, and
  double-check what actually got saved.
- **Framework Preset is a separate field from Root Directory setting it
  correctly.** Editing anything near the Framework Preset dropdown can
  change it away from `Next.js` (e.g. to `Astro`) without the change
  being obvious, and Vercel then auto-fills that other framework's
  Build/Output/Install/Development commands with **Override** switched
  on for all four. Confirm Framework Preset reads `Next.js` and all
  four Override switches are off before saving — an accepted wrong
  preset silently ships that other framework's commands.

**Do not try to route around it with a repo-root `vercel.json`.** Three
attempts were made and all three failed, each for a different reason
only visible in the real Vercel build log (CI never catches this —
GitHub Actions doesn't run a Vercel build):

1. `vercel.json` with `installCommand`/`buildCommand: cd dashboard &&
   ...` and an explicit `outputDirectory` — failed immediately with
   `No Next.js version detected`, because Vercel's framework check
   reads the **project root's** `package.json`, which has no `next`
   dependency.
2. Same `vercel.json`, plus `next` added to the root `package.json`'s
   `devDependencies` to satisfy that check — failed with the identical
   error anyway. The build log showed why: the custom `installCommand`
   only ever ran `npm install` inside `dashboard/`, so the repo root's
   own `node_modules` never got a `next` package installed into it
   at all. Vercel's check resolves an actual installed *version* from
   `node_modules` at the root, not just a name in `package.json` — no
   wording in the root `package.json` can substitute for that.

Both attempts, and the reasoning above, were reverted rather than left
half-working in the repo. There is no repo-side fix for this — Root
Directory changes where Vercel treats "the project" as living, and
nothing short of that setting moves the Next.js resolution into this
folder.

Set `FACTLEDGER_API_URL` to the deployed API's base URL (no trailing
path) as an environment variable — and `FACTLEDGER_API_KEY` too if that
API was started with `API_KEYS` set, or every server-side call it makes
will come back `401`.

⚠️ No successful Vercel build of this app has been observed yet.

## Pages

- `/` — wallet search + API health check
- `/wallet/[address]` — observable data, intelligence score, risk, evidence
  (per-instruction, with the same `confirmed`/`candidate`/`unknown`
  confidence mapping as the API), and the research agent's summary

## Why no Next.js API routes / database

This app is intentionally a thin read-only client of the existing
Express API in `../src`, not a second backend. See the main repo's
`CLAUDE.md` for why a database wasn't added: the platform is explicitly
stateless/read-only by design, and no concrete requirement for
persistence has been established yet.
