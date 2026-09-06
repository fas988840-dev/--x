<!-- Live page: https://fas988840-dev.github.io/--x/  ·  API: https://factledger-api.onrender.com -->

# FactLedger

**Reproducible Solana wallet intelligence.** Read-only. Deterministic. Evidence-cited.

[![CI](https://github.com/fas988840-dev/--x/actions/workflows/ci.yml/badge.svg)](https://github.com/fas988840-dev/--x/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-0B6E4F.svg)](LICENSE)
[![API status](https://img.shields.io/badge/API-live-0B6E4F.svg)](https://factledger-api.onrender.com/api/v1/health)

FactLedger turns raw Solana activity into behavioral metrics, an intelligence score, and a risk assessment — using public on-chain data only. It follows three rules it never breaks:

- **Read-only** — never requests or stores private keys, seed phrases, or secrets, and never signs a transaction.
- **Deterministic** — the same input always produces the same output; a CI test proves it on every commit.
- **Evidence-cited** — every finding names the signature, slot, and program it came from. When a fact isn't available, the answer is an explicit `UNKNOWN` / `null`, never a guess.

> Most wallet analytics ask you to trust a black box. FactLedger shows its work, so anyone can reproduce a result and check the math.

---

## Why it's different

Wallet scoring is a crowded space, and almost all of it is opaque: a number appears, and you take it on faith. FactLedger's wedge is **auditability**. Because the scoring model is fixed and transparent and the code is MIT-licensed, its central claim — that every score can be independently reproduced from the same on-chain input — is something anyone can actually exercise, not just believe.

That makes it suited to uses where a number has to be defensible: compliance and audit workflows, agent tooling that must not hallucinate, and any integration that needs a paper trail behind a risk call.

---

## The intelligence score

A transparent 0–100 score built from four sub-scores, each derived only from observable blockchain facts:

| Component | Measures |
|---|---|
| **Activity** | Transaction frequency and distinct-token diversity |
| **Sophistication** | Diversity of programs the wallet interacts with |
| **Consistency** | Regularity of activity patterns over time |
| **Efficiency** | Share of the wallet's transactions that succeeded |

A separate risk model reads the same metrics — failure rate, abnormal frequency, single-program concentration, volatility — and returns **low / medium / high**, with the exact numbers that triggered it.

---

## Evidence & confidence

Confidence is a **fixed mapping**, never an invented per-instance number:

| State | Confidence | Meaning |
|---|---|---|
| `confirmed` | `100` | Verified on-chain fact |
| `candidate` | `50` | Recognized but not fully decoded |
| `unknown` | `0` | Not available — returned as such, never filled in |

### What's verified today — and what's honestly still open

Publishing this openly is the point: a project that claims reproducibility must be auditable about its own maturity.

| Capability | State | Notes |
|---|---|---|
| Read-only wallet data & balances | ✅ verified | Transactions, SPL balances, metadata read live from RPC |
| Deterministic scoring & risk | ✅ verified | Covered by an automated determinism test in CI |
| Evidence engine | ✅ verified | Per-instruction citations with the fixed mapping above |
| Token mint/freeze-authority checks | ✅ verified | Never returns a bare "safe" |
| DEX adapters (Raydium V4, Jupiter V6) | 🟡 candidate | Program IDs verified; amount/mint extraction in progress |
| Live alert stream over RPC | 🟡 candidate | Same deterministic pipeline; pending production-RPC validation |
| Market-event tracking | ⚪ unknown | No pipeline yet — returns explicit `UNKNOWN` by design |

---

## API

Production REST API with request validation, rate limiting, and optional API-key auth. The same read-only pipeline is also exposed as an **MCP server**, so Claude Desktop, Claude Code, and other MCP hosts can call it directly as tools.

**Wallet**

```text
GET /api/v1/wallet/:address/analysis        Full read-out
GET /api/v1/wallet/:address/intelligence    Score + components
GET /api/v1/wallet/:address/risk            Risk + reasoning
GET /api/v1/wallet/:address/evidence        Cited findings
```

**Token & transaction**

```text
GET /api/v1/token/:mint/security            Mint/freeze authority checks
GET /api/v1/token/:mint/price               Priced, or null if unavailable
GET /api/v1/transaction/:signature          Transaction metadata
GET /api/v1/health                          Liveness
```

Example:
```bash
curl 'https://factledger-api.onrender.com/api/v1/wallet/<address>/analysis'

git clone https://github.com/fas988840-dev/--x.git
cd --x
npm install
cp .env.example .env.local     # never commit real credentials
npm run dev                    # or: npm run build && npm run start
npm run mcp                    # run as an MCP server over stdio
```

Requires Node.js 18+. See QUICK_START.md for the full setup and CLAUDE.md for architecture and design principles.

Security

- No private keys, ever — read-only access, no signing, no secret storage.
- API-key auth — required before any public deployment (API_KEYS); the server warns on stderr if a production deploy is left open.
- Rate limiting — two tiers per IP via express-rate-limit.
- Safe CORS defaults — GET/OPTIONS only, explicit origin allowlist.
- Dependency scanning — Dependabot + npm audit in CI.

See SECURITY.md.

Disclaimers

FactLedger provides data analysis only. Scores are derived from observable on-chain behavior, are not financial advice, do not indicate portfolio quality, and do not predict performance. A clean security check is never a claim that a token or wallet is “safe.” Users are solely responsible for their own decisions.

License

MIT — see LICENSE. © 2026 Abdullah Al-Anzi.

The code is open on purpose: a license forbidding copying would make the project’s core claim — reproducible, auditable scores — impossible to exercise.
