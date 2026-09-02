# FactLedger Deployment Guide

> ⚠️ **Updated for browser-only deployment.** The previous version of this
> file listed Fly.io as the recommended option and contained
> `CORS_ORIGIN=*` examples — both are now incorrect.  
> `src/api/server.ts` treats `CORS_ORIGIN` as a comma-separated list of
> exact origins; `*` matches none and silently blocks every browser-based
> request. See [`README.md`](README.md)'s "Deployment" section for the
> full quick-start.

---

## Recommended: Render.com (Browser-only, No CLI required)

Render.com reads the committed `render.yaml` file from this repo
automatically. No `fly.toml`, no `railway.json`, no CLI installs needed.

### Step-by-step (browser only)

1. Go to [render.com](https://render.com) → sign in / create account.
2. Click **New +** → **Web Service**.
3. Connect your GitHub account → select `fas988840-dev/PROJECT-x`.
4. Render detects `render.yaml` automatically and pre-fills most settings.
5. Under **Environment** add any secrets not in `render.yaml`:
   - `API_KEYS` (optional — comma-separated; if unset, API is open)
   - `CHAINGPT_API_KEY` (optional — enables AI explanations)
   - `CORS_ORIGIN` (set to your dashboard's Vercel URL once it's deployed)
6. Click **Create Web Service**.
7. Wait for the build (~2 min). Service URL: `https://factledger-api.onrender.com`.

> **Note:** Free tier services on Render spin down after 15 minutes of
> inactivity and restart on the next request (cold start ~30 s). Upgrade
> to a paid instance type for always-on production use.

### GitHub Actions CI/CD

Once you have the Render service URL and API key, add these two secrets
to the repository (**Settings → Secrets and variables → Actions**):

| Secret name | Where to find it |
|---|---|
| `RENDER_API_KEY` | render.com → Account Settings → API Keys |
| `RENDER_SERVICE_ID` | render.com → service Settings (starts with `srv-`) |

After both secrets are set, every push to `main` that touches source code,
the `Dockerfile`, or `render.yaml` will automatically trigger a deploy via
the `deploy-render.yml` workflow and then run a live health check via
`live-verify.yml`.

---

## Dashboard: Vercel (Browser setup + automatic deploys)

The `dashboard/` Next.js app deploys to Vercel via `deploy-dashboard.yml`.

### Setup (browser only)

1. Go to [vercel.com](https://vercel.com) → sign in / create account.
2. Click **Add New… → Project** → import `fas988840-dev/PROJECT-x`.
3. Set **Root Directory** to `dashboard` (Vercel auto-detects Next.js).
4. Under **Environment Variables** add:
   - `FACTLEDGER_API_URL` = `https://factledger-api.onrender.com` (or your Render URL)
5. Click **Deploy**.

Then add one secret to GitHub Actions:

| Secret name | Where to find it |
|---|---|
| `VERCEL_TOKEN` | vercel.com → Settings → Tokens → Create |

After that, every push to `main` that touches `dashboard/` triggers an
automatic Vercel deployment via `deploy-dashboard.yml` — it discovers
your org/project IDs from the token automatically, no `vercel link` needed.

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `SOLANA_RPC_URL` | Yes | — | Solana JSON-RPC endpoint |
| `PORT` | No | `3000` | HTTP port the server listens on |
| `CORS_ORIGIN` | No | (none — all origins blocked) | Comma-separated list of allowed browser origins (e.g. `https://myapp.vercel.app`) |
| `API_KEYS` | No | — | Comma-separated keys; if set, all routes except `/api/v1/health` require `X-API-Key` header |
| `PRICE_PROVIDER` | No | `coingecko` | `coingecko` or `stub` (stub always returns null) |
| `CHAINGPT_API_KEY` | No | — | Enables AI-generated summaries in `/api/v1/wallet/:address/explanation` |
| `NODE_ENV` | No | `production` | `production` or `development` |

> `CORS_ORIGIN=*` does **not** allow all origins — the app treats it as a
> literal origin string that matches nothing. To allow all origins in
> development, run without setting `CORS_ORIGIN` and note that the server
> still blocks cross-origin browser requests (use direct curl/API client
> calls for local testing). For production, always list exact origins.

---

## Solana RPC Provider Notes

The default `https://api.mainnet-beta.solana.com` endpoint:
- Supports all read-only JSON-RPC calls (analysis, intelligence, risk).
- **Restricts WebSocket log subscriptions** — the `/api/v1/wallet/:address/alerts/stream`
  Server-Sent Events endpoint may fail silently on free public endpoints.

For production live-alert streaming, use a dedicated RPC provider:
- [Helius](https://helius.dev) — free tier available
- [QuickNode](https://quicknode.com)
- [Alchemy](https://alchemy.com)

---

## Manual: Docker (own infrastructure)

```bash
# Build
docker build -t factledger:latest .

# Run
docker run -p 3000:3000 \
  -e SOLANA_RPC_URL="https://api.mainnet-beta.solana.com" \
  -e CORS_ORIGIN="https://your-dashboard.vercel.app" \
  factledger:latest

# Test
curl http://localhost:3000/api/v1/health
```

---

## Manual: Fly.io (requires CLI — not browser-deployable)

Fly.io's token creation requires their CLI or SSO login, which is not
possible from a browser-only workflow. The `deploy-fly.yml` GitHub Action
is therefore **manual-only** (`workflow_dispatch`) and will not auto-run.

If you have `flyctl` installed locally:

```bash
flyctl auth login
flyctl launch          # first time; reads fly.toml if present
flyctl secrets set SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
flyctl secrets set CORS_ORIGIN="https://your-dashboard.vercel.app"
flyctl deploy
```

**Render.com is the recommended alternative** — same Docker-based hosting,
but fully operable from a browser.

---

## Testing the Deployment

```bash
# Health check (always open, no API key needed)
curl https://factledger-api.onrender.com/api/v1/health

# Wallet intelligence
curl https://factledger-api.onrender.com/api/v1/wallet/11111111111111111111111111111112/intelligence

# List supported protocols/programs
curl https://factledger-api.onrender.com/api/v1/protocols

# Real-time alerts (Server-Sent Events)
curl -N https://factledger-api.onrender.com/api/v1/wallet/11111111111111111111111111111112/alerts/stream
```

---

## Troubleshooting

**"Cannot connect to Solana RPC"**  
Check `SOLANA_RPC_URL` is reachable. The default mainnet endpoint may be
rate-limited; try a dedicated provider.

**"WebSocket subscription failed"**  
Free public RPC endpoints restrict log subscriptions. Use a dedicated
provider (Helius, QuickNode, Alchemy) for the alerts stream.

**"CORS errors in browser"**  
Set `CORS_ORIGIN` to your dashboard's exact origin (e.g.
`https://my-dashboard.vercel.app`). Multiple origins:
`https://app.com,https://staging.app.com`. Do not use `*` — it matches
nothing in this server's implementation.

**"X-API-Key header not accepted"**  
Verify the header name is exactly `X-API-Key` and that the value matches
one of the comma-separated values in the `API_KEYS` environment variable.

**"Service is slow / timing out"**  
Free tier Render services spin down after 15 minutes of inactivity.
The first request after a spin-down has a ~30 s cold start. Upgrade to a
paid instance to keep the service always-on.

---

## Support

- **Issues**: https://github.com/fas988840-dev/PROJECT-x/issues
- **Docs**: [README.md](README.md)
