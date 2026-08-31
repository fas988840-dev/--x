# FactLedger Automation Scripts

Quick-start scripts to automate deployment and grant submissions.

---

## Quick Start

### Run Everything Interactively (Recommended)

```bash
bash scripts/complete-setup.sh
```

This script will:
1. ✅ Verify repository is public
2. ✅ Guide you through deployment (Fly.io/Railway/Render)
3. ✅ Show grant submission instructions

---

## Individual Scripts

### 1. Make Repository Public

```bash
bash scripts/make-public.sh
```

**Requirements:**
- GitHub CLI (`gh`) installed
- Authenticated with `gh auth login`

**What it does:**
- Uses GitHub CLI to change repository visibility to public
- Verifies the change was successful

**If it fails:**
- Install GitHub CLI: https://cli.github.com
- Or make it public manually at: https://github.com/fas988840-dev/PROJECT-x/settings

---

### 2. Deploy to Fly.io

```bash
bash scripts/deploy-fly.sh
```

**Requirements:**
- Fly.io account (free at https://fly.io)
- `flyctl` CLI installed
- Authenticated with `flyctl auth login`

**What it does:**
1. Checks if `flyctl` is installed
2. Creates `fly.toml` configuration
3. Sets environment variables
4. Deploys to Fly.io
5. Shows your live API URL

**Result:**
Your API is live at: `https://<app-name>.fly.dev`

**If it fails:**
- Install flyctl: https://fly.io/docs/getting-started/installing-flyctl/
- Or deploy manually using `DEPLOYMENT.md`

---

### 3. Complete Interactive Setup

```bash
bash scripts/complete-setup.sh
```

**What it does:**
1. Checks if repository is public (if not, shows how to make it public)
2. Offers 3 deployment options (Fly.io, Railway, Render)
3. Shows grant submission instructions
4. Provides summary of next steps

**This is the recommended way to complete everything!**

---

## Environment Variables

The scripts automatically set these when deploying:

```
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
PORT=3000
CORS_ORIGIN=*
NODE_ENV=production
```

To customize, edit:
- `.env.example` for local development
- Or set environment variables in your platform (Fly.io/Railway/Render)

---

## Troubleshooting

### "flyctl is not installed"
```bash
# macOS
brew install flyctl

# Linux
curl https://fly.io/install.sh | sh

# Windows
choco install flyctl
```

### "Not authenticated with Fly.io"
```bash
flyctl auth login
```

### "Repository link returns 404"
- Go to: https://github.com/fas988840-dev/PROJECT-x/settings
- Make repository PUBLIC (Danger Zone section)

### "Can't run bash script"
```bash
# Give execute permission
chmod +x scripts/*.sh

# Run again
bash scripts/complete-setup.sh
```

---

## Manual Alternatives

If scripts don't work for you:

### Make Repository Public (Manual)
1. Go to: https://github.com/fas988840-dev/PROJECT-x/settings
2. Scroll to "Danger Zone" (red section)
3. Click "Change repository visibility"
4. Select "Make public"
5. Type `PROJECT-x` to confirm

### Deploy (Manual)
See `DEPLOYMENT.md` for full instructions

### Submit Grants (Manual)
See `GRANTS/DETAILED_INSTRUCTIONS.md` for step-by-step

---

## Support

- **Questions?** Check `COMPLETION_SUMMARY.md`
- **Deployment issues?** See `DEPLOYMENT.md`
- **Grant questions?** See `GRANTS/DETAILED_INSTRUCTIONS.md`
- **GitHub issues?** See `GITHUB_SETUP.md`

---

## Files in This Directory

| File | Purpose |
|------|---------|
| `complete-setup.sh` | Main interactive setup script |
| `make-public.sh` | Make repository public |
| `deploy-fly.sh` | Deploy to Fly.io |
| `README.md` | This file |

---

## Next Steps

1. **Run the setup script:**
   ```bash
   bash scripts/complete-setup.sh
   ```

2. **Follow the prompts** to:
   - Verify repository is public
   - Deploy to your chosen platform
   - Get grant submission instructions

3. **Submit grants** using the answers in `GRANTS/grant-answers.html`

---

**Ready? Start here:**
```bash
bash scripts/complete-setup.sh
```
