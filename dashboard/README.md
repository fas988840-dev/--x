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
project (the Express API), so **the Vercel project's Root Directory
must be set to `dashboard`** — under Settings → Build and Deployment.
Next.js is auto-detected from there and nothing else needs configuring.

There is no repo-side way around this. A root-level `vercel.json`
pointing `installCommand`/`buildCommand`/`outputDirectory` at this
folder was tried and **failed**, on both `main` and a branch head. The
build log shows why: the install command ran fine (`cd dashboard && npm
install`, 28 packages in 14s), and then

```
Warning: Could not identify Next.js version, ensure it is defined as a project dependency.
Error: No Next.js version detected. Make sure your package.json has "next" in either "dependencies" or "devDependencies".
```

Vercel resolves the framework against the **project root's**
`package.json` — which here is the Express API, and has no `next`
dependency — regardless of where `vercel.json` points the commands. The
only thing that moves that resolution into this folder is the Root
Directory setting. (Adding `next` to the API's `package.json` to
satisfy the check would work and is not worth it: it would pull Next.js
into the API's Docker image and audit surface for nothing.)

That `vercel.json` has been removed rather than left in the repo
breaking every build.

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
