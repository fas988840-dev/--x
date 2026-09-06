# FactLedger — Current Action Items

Updated: 2026-09-06

This file replaces the older pre-deployment checklist. It reflects the canonical repository and current production-readiness work.

## Completed / verified

- [x] Canonical public repository: `https://github.com/fas988840-dev/--x`
- [x] Public API deployment: `https://factledger-api.onrender.com`
- [x] CI and CodeQL configured.
- [x] Dependabot breaking major updates for ESLint and TypeScript are blocked pending review.
- [x] Merged Pyth REST/MCP integration with explicit feed mapping and UNKNOWN/null fallback.
- [x] Live verification workflow exists for production smoke testing.
- [x] Security policy/threat-model hardening is tracked in `SECURITY.md`.
- [x] OpenAPI entry point is tracked in `docs/openapi.yaml`.
- [x] Release gates are tracked in `PRODUCTION_READINESS.md`.
- [x] Grant/application status is tracked under `GRANTS/`; do not duplicate already submitted applications without a reason.

## External/account-controlled blockers

- [ ] Obtain a real Pyth API key through the founder's Pyth account.
- [ ] Verify production mint→USD feed IDs against Pyth's official feed catalog.
- [ ] Store Pyth credentials/feed mapping in production secrets and run `scripts/verify-pyth.ts` against the real account.
- [ ] Re-deploy and verify `/api/v1/health` reports the price provider operational rather than degraded.
- [ ] Verify production `API_KEYS`, `CORS_ORIGIN`, `SOLANA_RPC_URL`, and `NODE_ENV=production` are configured in the host secret store.
- [ ] Ensure the GitHub live-verification workflow has `FACTLEDGER_API_URL` and any required API key secret.
- [ ] Link a real Vercel team/project if the dashboard is to be deployed on Vercel. The current connected Vercel integration exposes no team/project.
- [ ] Recruit and verify first external developers/integrations; do not claim MAU, revenue, customers, TVL, or adoption before evidence exists.

## v1.0 release gate

Do not tag v1.0 until `PRODUCTION_READINESS.md` is satisfied or any deliberately excluded capability is documented as out of scope. At minimum, CI/CodeQL and the live production verification must pass on the release commit, production secrets must be configured, rollback must be known, and security/API documentation must be current.

## Next execution order

1. Merge this documentation hardening only after CI passes.
2. Complete founder-controlled Pyth credentials/feed verification.
3. Run production live verification against Render.
4. Link/deploy the dashboard on Vercel if Vercel is still the desired frontend host.
5. Run full end-to-end dashboard → API → Solana/Pyth verification.
6. Obtain external-user proof.
7. Cut v1.0 only when the release gate is satisfied.
