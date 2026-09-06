# Security Policy

FactLedger is a read-only Solana intelligence service. It does not request, store, or use wallet private keys, seed phrases, signing keys, or transaction-signing permissions.

## Supported versions

Security fixes are applied to the current `main` branch. Until a stable v1.0 release is cut, no older release line is guaranteed to receive backports.

## Reporting a vulnerability

Please report security issues privately to `fas988840@gmail.com` with:

- a concise description of the issue;
- affected endpoint/file and commit SHA when known;
- reproduction steps or proof of concept;
- expected impact;
- any suggested remediation.

Do not include real private keys, seed phrases, access tokens, API keys, or personal data in reports. Please allow a reasonable remediation window before public disclosure.

## Threat model

### Assets to protect

- Availability of the public API and MCP service.
- Integrity of wallet-analysis, risk, scoring, evidence, and token-security results.
- Confidentiality of deployment secrets such as API keys and RPC/Pyth credentials.
- User trust that unknown or unverifiable values are returned as `null`/`UNKNOWN`, never fabricated.

### Primary threats and controls

| Threat | Current control |
| --- | --- |
| Secret leakage | Secrets are configuration-only; `.env` files are ignored; production credentials must stay in deployment/GitHub secret stores. |
| Unauthorized API consumption | Optional `API_KEYS` authentication with `X-API-Key`; production deployments should enable it for non-health routes. |
| Abuse / scraping / RPC exhaustion | Global and RPC-heavy route rate limits; exact proxy trust configuration; request-size limit. |
| Malicious input | Solana wallet/signature/mint validation; bounded query parameters; centralized error handling. |
| Browser-origin abuse | Exact CORS allowlist; CORS is not treated as authentication. |
| Dependency compromise | Dependabot, CodeQL, CI lint/type-check/test/build gates; breaking major ESLint/TypeScript updates are blocked until reviewed. |
| Stale/fabricated market data | Pyth provider uses explicit feed mapping, max age, timeout, redirect rejection, and `UNKNOWN` fallback on invalid/unavailable data. |
| Sensitive error disclosure | Production generic 500 responses do not expose stack traces. |
| Stale API responses | `Cache-Control: no-store`/`no-cache` headers are applied to live API responses. |

## Production hardening requirements

Before calling a deployment production-ready:

1. Set `NODE_ENV=production`.
2. Configure `API_KEYS` with rotated, non-repository secrets.
3. Configure `CORS_ORIGIN` to the exact production dashboard origin(s).
4. Use a dedicated Solana RPC endpoint with quotas appropriate to expected load.
5. Store `PYTH_API_KEY` only in the deployment secret store; never commit it.
6. Keep `PYTH_FEED_MAP_JSON` limited to feed IDs verified against Pyth's official feed catalog.
7. Run CI, CodeQL, and live verification against the deployed service.
8. Review logs for secret/token exposure before enabling broader traffic.
9. Maintain a rollback path to the previously known-good deployment.

## Explicit non-goals

FactLedger is not a wallet, custodian, exchange, transaction signer, trading system, or financial adviser. A low risk score or clean token-authority check must not be represented as a guarantee of safety, solvency, or future performance.
