# Production Readiness

Updated: 2026-09-06

This document is the operational release gate for FactLedger. It distinguishes verified capabilities from external/account-controlled blockers and prevents "production-ready" claims before the evidence exists.

## Current verified baseline

- GitHub CI: lint, type-check, tests, and build are configured on every push/PR.
- CodeQL is configured.
- Dependabot major upgrades for ESLint/TypeScript are blocked pending manual review.
- Live API exists at `https://factledger-api.onrender.com` with `/api/v1/health`.
- REST and MCP expose read-only intelligence paths.
- Pyth adapter is implemented with explicit feed mapping, timeout, stale/future-data rejection, and UNKNOWN/null fallback.
- Live verification workflow exercises health, wallet intelligence, risk, explanation fallback, validation failure, and Solana RPC reachability when deployment secrets are configured.

## Release gates

### 1. Pyth production activation — BLOCKED BY ACCOUNT SECRET

Required evidence:

- `PYTH_API_KEY` obtained from Pyth Terminal and stored only in deployment secrets.
- `PYTH_FEED_MAP_JSON` contains feed IDs verified against the official Pyth feed catalog.
- `scripts/verify-pyth.ts` succeeds against the real account and records publication time/feed ID/confidence evidence without printing secrets.
- Production `/api/v1/health` reports the price provider operational rather than degraded.

Do not commit the key or invent feed IDs.

### 2. Production deployment — PARTIALLY COMPLETE

Current primary API host: Render.

Required before claiming complete production readiness:

- Render service health check points at `/api/v1/health`.
- Production secrets set: `NODE_ENV`, `SOLANA_RPC_URL`, `API_KEYS`, `CORS_ORIGIN`, and Pyth variables when activated.
- GitHub `FACTLEDGER_API_URL` is set so `.github/workflows/live-verify.yml` can validate the deployed instance.
- Rollback path to the previous known-good Render deployment is documented and tested operationally.

Vercel is suitable for the dashboard, but the currently connected Vercel integration exposes no team/project, so dashboard deployment cannot be verified from the current connection.

### 3. End-to-end verification — IMPLEMENTED, LIVE PASS REQUIRED

The live verification workflow already covers the core API flow. A release gate is satisfied only when the workflow passes against the actual production URL after the release commit.

For a stronger v1.0 gate, manually verify:

1. Dashboard accepts a valid Solana address.
2. Dashboard calls the configured production API URL.
3. API validates and queries Solana RPC.
4. Result renders score/risk/evidence without invented fields.
5. Invalid addresses return a stable 400 error.
6. Rate-limit/auth failures are understandable and do not leak secrets.
7. Pyth price requests return provider evidence or explicit UNKNOWN/null.

### 4. Security — BASELINE IMPLEMENTED

See `SECURITY.md`.

Before broader traffic:

- enable `API_KEYS` in production;
- restrict `CORS_ORIGIN` to exact dashboard origins;
- use a dedicated Solana RPC provider;
- rotate any credential ever copied into an insecure channel;
- review production logs for accidental secret/header logging;
- keep CI and CodeQL green.

### 5. Data integrity — CORE DIFFERENTIATOR

The release must preserve these invariants:

- unknown evidence remains UNKNOWN/null;
- no synthetic transactions, prices, mints, signatures, or confidence values;
- intelligence/risk outputs remain deterministic for identical examined evidence;
- evidence records cite real transaction signatures and program IDs;
- candidate protocol recognition must not be relabeled confirmed without verified account-layout decoding.

### 6. Observability — PARTIAL

Existing controls: health endpoint, application logging, Render platform logs, GitHub live verification.

For v1.0, track at minimum:

- request count and status-code distribution;
- p50/p95/p99 latency for RPC-heavy routes;
- Solana RPC failures/timeouts;
- Pyth authentication/timeouts/stale-data fallbacks;
- rate-limit events;
- deploy version/commit SHA in incident notes.

Never log API keys, authorization headers, seed phrases, private keys, or complete sensitive request headers.

### 7. Developer API — SPEC ADDED

`docs/openapi.yaml` provides an OpenAPI 3.1 entry point for the major public endpoints and the optional API-key model. Keep it synchronized with route changes.

### 8. Usage proof — NOT YET VERIFIED

Do not claim MAU, customers, integrations, revenue, TVL, awards, or community size without evidence. For grants and investors, the next useful proof is a small set of real external developers using the API/MCP and agreeing to be referenced or counted anonymously.

### 9. Demo — EXISTS, VALIDATION STILL REQUIRED

Repository demo/documentation exists. The stronger demo is the deployed dashboard performing a real wallet analysis against production with clear evidence links and UNKNOWN/null behavior visible.

### 10. v1.0 release — NOT READY YET

Do not tag v1.0 until all of the following are true:

- CI and CodeQL pass on the release commit;
- production live verification passes;
- Pyth production activation is either complete or explicitly excluded from v1.0 scope;
- production secrets/auth/CORS are configured;
- OpenAPI and security docs are current;
- rollback procedure is verified;
- at least one real external-user/integration proof is recorded, or v1.0 is explicitly described as a developer preview with no traction claim.

## Decision

Current state: **conditionally production-capable, not yet v1.0-ready**.

The remaining blockers are external/account-controlled rather than missing core architecture: Pyth credentials/feed verification, Vercel account/project linkage for the dashboard if Vercel is desired, production secret configuration, a live release-gate pass, and real-user proof.
