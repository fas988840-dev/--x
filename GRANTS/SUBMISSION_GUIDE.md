# Grant Submission Guide

> ⚠️ **This file is out of date and superseded.** For current grant status
> and strategy, read [`funding-roadmap.md`](funding-roadmap.md).

## Status: Solana Foundation ✅ SUBMITTED

**Submission Date:** August 31, 2026  
**Confirmation:** Email received from grants@solana.org

---

## Ready to Submit: Other Grant Programs

### 1️⃣ ChainGPT Research Grant

**Platform:** https://www.chaingpt.org/web3-ai-grant  
**Submission Type:** Research Grant Application  
**Funding Requested:** $10,000 USD

**File to Use:**
- `/GRANTS/chaingpt-research-grant.md`
- `grant-answers.html` → Copy "ChainGPT Research Grant" section

**Steps:**
1. Go to https://www.chaingpt.org/web3-ai-grant
2. Click "Apply for Research Grant"
3. Fill out form fields (use answers from `grant-answers.html`):
   - **Project Name:** FactLedger - Solana Wallet Intelligence Platform
   - **Email:** fas988840@gmail.com
   - **GitHub:** https://github.com/fas988840-dev/PROJECT-x
   - **Problem Statement:** [Copy from grant-answers.html]
   - **Solution & Innovation:** [Copy from grant-answers.html]
   - **Proof of Work:** Link to CI run + repo
   - **Budget Breakdown:** [From grant-answers.html]
4. Upload supporting documents:
   - `GRANTS/chaingpt-research-grant.md` (full proposal)
5. Submit

---

### 2️⃣ Colosseum Eternal Grant (Solana DeFi Track)

**Platform:** https://colosseum.org  
**Submission Type:** Infrastructure Grant  
**Funding:** Varies by tier

**File to Use:**
- `/GRANTS/colosseum-eternal-grant.md`
- `grant-answers.html` → Copy "Colosseum" section

**Steps:**
1. Go to https://colosseum.org/apply
2. Select **"DeFi Infrastructure"** track
3. Fill form with:
   - **Project Name:** FactLedger
   - **Category:** Solana DeFi Infrastructure
   - **Description:** [From grant-answers.html]
   - **Technical Architecture:** [From Colosseum grant file]
   - **Solana Wallet:** `EWEY53t7rXLTQ964EhuAXHAMV9WoEkxn4h4fYB1ZRFNM`
4. Submit

---

### 3️⃣ Superteam Earn (Alternative Track)

**Platform:** https://earn.superteam.fun  
**Submission Type:** Developer Tools  
**Funding:** $200 - $5,000 USD

**File to Use:**
- `/GRANTS/superteam-earn-grant.md`
- `grant-answers.html` → Copy "Superteam" section

**Steps:**
1. Go to https://earn.superteam.fun/grants
2. Click **"Create New Bounty"** or **"Apply for Grant"**
3. Select **"Developer Tools"** category
4. Fill with:
   - **Title:** FactLedger - Solana Wallet Intelligence
   - **Description:** [From grant-answers.html]
   - **Proof of Work:** GitHub link + CI badge
   - **Budget Requested:** $5,000
5. Submit

---

## All Your Data (Copy-Paste Ready)

### Personal Info
- **Name:** Abdullah Al-Anzi
- **Email:** fas988840@gmail.com
- **GitHub:** https://github.com/fas988840-dev
- **X/Twitter:** @aamm123220
- **Solana Wallet:** `EWEY53t7rXLTQ964EhuAXHAMV9WoEkxn4h4fYB1ZRFNM`

### Project Info
- **Name:** FactLedger
- **Repository:** https://github.com/fas988840-dev/PROJECT-x
- **Live Demo:** https://factledger-api.onrender.com
- **CI Badge:** https://github.com/fas988840-dev/PROJECT-x/actions/workflows/ci.yml
- **Last Verified Run:** Commit `21e8fea` (133 tests passing)

### Quick Descriptions

**One-liner:**
> Deterministic Solana wallet analysis platform with verified DEX detection and honest confidence tiering.

**Short (50 words):**
> FactLedger is a read-only Solana wallet intelligence API. It turns raw on-chain transaction history into behavioral metrics, intelligence scores, and risk assessments — with every number independently verifiable from the blockchain. Never fabricates; always states confidence honestly.

**Long (200 words):**
> [See GRANTS/*/md files for full descriptions]

---

## Links to All Files

| File | Purpose |
|------|---------|
| `GRANTS/solana-foundation-proposal-doc.md` | Solana Foundation full proposal |
| `GRANTS/chaingpt-research-grant.md` | ChainGPT grant application |
| `GRANTS/colosseum-eternal-grant.md` | Colosseum grant application |
| `GRANTS/superteam-earn-grant.md` | Superteam grant application |
| `GRANTS/grant-answers.html` | Copy-paste answer sheet for all platforms |
| `docs/proposal.html` | Formatted version of proposal (for review) |
| `DEPLOYMENT.md` | How to deploy the API to production |

---

## Checklist Before Each Submission

- [ ] Repository is **public** (GitHub Settings → Danger Zone → Change visibility)
- [ ] CI badge shows **green** (all tests passing)
- [ ] Live demo URL is **accessible** (not a 404)
- [ ] All links in proposal are **working**
- [ ] Wallet address is correct: `EWEY53t7rXLTQ964EhuAXHAMV9WoEkxn4h4fYB1ZRFNM`
- [ ] Email address is correct: `fas988840@gmail.com`
- [ ] GitHub repository link is correct: https://github.com/fas988840-dev/PROJECT-x

---

## FAQ

**Q: Can I submit to multiple platforms at once?**  
A: Yes. Each grant platform accepts independent submissions. Submit to all.

**Q: What if a platform asks for my X/Twitter?**  
A: Use your personal account: `@aamm123220`

**Q: What if they ask for a company/legal entity?**  
A: You are a solo developer. Use your name: "Abdullah Al-Anzi (solo developer)"

**Q: What if the repository is still private?**  
A: Make it public first! Go to https://github.com/fas988840-dev/PROJECT-x/settings → Danger Zone → Change repository visibility → Make public

**Q: Where do I deploy the API?**  
A: See `DEPLOYMENT.md` for Fly.io, Railway, or Render (5-minute setup)

**Q: What if CI is red?**  
A: Run `npm test` locally to debug. Fix any issues and push. CI will run automatically.

---

## Next Steps

1. **Make repository public** (if not already done)
2. **Deploy API to production** (Fly.io/Railway/Render) — needed for Milestone 1
3. **Submit to ChainGPT** (copy from `chaingpt-research-grant.md`)
4. **Submit to Colosseum** (copy from `colosseum-eternal-grant.md`)
5. **Submit to Superteam** (copy from `superteam-earn-grant.md`)

---

## Support

- **Questions?** Email fas988840@gmail.com
- **Issues?** Open https://github.com/fas988840-dev/PROJECT-x/issues
- **Docs?** Read https://github.com/fas988840-dev/PROJECT-x/blob/main/README.md
