# FactLedger Deployment Guide

> ⚠️ **This file is out of date and superseded.** It predates the
> `render.yaml` / `railway.json` / `fly.toml` blueprint configs already in
> this repo, and its `CORS_ORIGIN=*` example below **contradicts** the app's
> actual behavior — `src/api/server.ts` treats `CORS_ORIGIN` as a
> comma-separated list of exact origins; `*` matches none and silently
> blocks every browser (see `render.yaml`'s own comment). Deploy from the
> committed `render.yaml` blueprint instead of these manual steps; see
> [`README.md`](README.md)'s "Deployment" section.

## Quick Start: Deploy to Production (5 minutes)

### Option 1: Fly.io (Recommended)

```bash
# 1. Install flyctl
# macOS: brew install flyctl
# Linux: curl https://fly.io/install.sh | sh
# Windows: choco install flyctl

# 2. Login
flyctl auth login

# 3. Launch the app
flyctl launch

# 4. Set environment variables
flyctl secrets set SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
flyctl secrets set CORS_ORIGIN="https://*.yourdomain.com"
flyctl secrets set PORT="3000"

# 5. Deploy
flyctl deploy
```

**Cost:** Free tier includes 3 shared-cpu-1x VMs  
**Result:** Your API is live at `https://<app-name>.fly.dev`

---

### Option 2: Railway

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select `fas988840-dev/PROJECT-x`
4. Add environment variables:
   - `SOLANA_RPC_URL=https://api.mainnet-beta.solana.com`
   - `CORS_ORIGIN=*` (development) or domain (production)
   - `PORT=3000`
5. Deploy

**Cost:** Free tier (5,000 compute minutes/month)  
**Result:** Your API is live at `https://<project>.railway.app`

---

### Option 3: Render

1. Go to https://render.com
2. Click "New+" → "Web Service"
3. Connect GitHub repo → `fas988840-dev/PROJECT-x`
4. Add environment variables (same as above)
5. Deploy

**Cost:** Free tier (spins down after 15 min inactivity)  
**Result:** Your API is live at `https://<service>.onrender.com`

---

## Environment Variables

| Variable | Required | Default | Example |
|----------|----------|---------|---------|
| `SOLANA_RPC_URL` | Yes | - | `https://api.mainnet-beta.solana.com` |
| `PORT` | No | `3000` | `3000` |
| `CORS_ORIGIN` | No | `*` | `https://myapp.com,https://api.myapp.com` |
| `API_KEYS` | No | - | `key1,key2,key3` (comma-separated) |
| `PRICE_PROVIDER` | No | `coingecko` | `coingecko` or `stub` |
| `CHAINGPT_API_KEY` | No | - | Your ChainGPT API key |
| `NODE_ENV` | No | `production` | `production` or `development` |

---

## Important Notes

### Solana RPC Provider

- **Free public endpoints** (api.mainnet-beta.solana.com) restrict WebSocket subscriptions
- For production use with `/api/v1/wallet/:address/alerts/stream`, use a **dedicated RPC provider:**
  - [Helius](https://helius.dev) — Free tier available
  - [Magic Eden](https://magiceden.io)
  - [QuickNode](https://quicknode.com)

### CORS Configuration

- Development: `CORS_ORIGIN=*` (allow all origins)
- Production: `CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com`

### API Keys

- If `API_KEYS` is set: all endpoints except `/api/v1/health` require `X-API-Key` header
- If unset: all endpoints are open

---

## Testing the Deployment

Once deployed, test these endpoints:

```bash
# Health check
curl https://<your-api-url>/api/v1/health

# Get wallet intelligence
curl https://<your-api-url>/api/v1/wallet/11111111111111111111111111111112/intelligence

# Get available protocols
curl https://<your-api-url>/api/v1/protocols

# Real-time alerts (Server-Sent Events)
curl -N https://<your-api-url>/api/v1/wallet/11111111111111111111111111111112/alerts/stream
```

---

## Monitoring

### Fly.io
```bash
flyctl logs
flyctl status
flyctl apps list
```

### Railway
Dashboard at https://railway.app — view logs in real-time

### Render
Dashboard at https://render.com — view logs in real-time

---

## Scaling

### For high traffic:
- **Fly.io**: Scale up instance size with `flyctl scale vm shared-cpu-2x`
- **Railway**: Add more VMs via dashboard
- **Render**: Upgrade to paid tier

### Rate Limiting (Built-in)
- General: 60 requests per 15 minutes per IP
- Heavy routes (wallet/transaction): 20 requests per 15 minutes per IP

---

## Docker (Manual Deployment)

If deploying to your own infrastructure:

```bash
# Build image
docker build -t factledger:latest .

# Run container
docker run -p 3000:3000 \
  -e SOLANA_RPC_URL="https://api.mainnet-beta.solana.com" \
  -e CORS_ORIGIN="*" \
  factledger:latest

# Test
curl http://localhost:3000/api/v1/health
```

---

## Troubleshooting

### "Cannot connect to Solana RPC"
- Check `SOLANA_RPC_URL` is correct and reachable
- Verify your network allows outbound HTTPS to the RPC endpoint

### "WebSocket subscription failed"
- Free endpoints restrict log subscriptions
- Switch to a dedicated RPC provider (see "Solana RPC Provider" section above)

### "CORS errors in browser"
- Set `CORS_ORIGIN` to match your frontend's domain
- Multiple origins: `https://app.com,https://api.app.com`

### "API_KEY header not accepted"
- Verify header is named `X-API-Key` (capital X, capital K)
- Check that `API_KEYS` environment variable is set

---

## Support

- **Issues**: https://github.com/fas988840-dev/PROJECT-x/issues
- **Email**: fas988840@gmail.com
- **Docs**: https://github.com/fas988840-dev/PROJECT-x/blob/main/README.md
