# Pyth integration — implemented, activation pending

Updated 2026-09-05. This integration retrieves provider-reported market data;
it does not locally verify Pyth signatures or submit any transaction.

## Implemented

- Shared provider selection for REST and MCP, using `PRICE_PROVIDER=pyth`.
- REST `GET /api/v1/token/:mint/price` with optional Unix-seconds `timestamp`, existing authentication, input validation and rate limits.
- MCP `token_price` with the same mint and optional timestamp inputs.
- Explicit mint-to-USD-feed mapping; no guessed feed IDs or replacement price on failure.
- Hermes v2 Bearer authentication, request timeout and redirect rejection.
- Invalid, duplicate, missing, stale or future-dated Pyth quotes return `null`/`unknown`.
- Returned publication time, feed ID and confidence interval; confidence bands describe relative price uncertainty, not investment success or token safety.

## Configure privately

The [Pyth Core upgrade documentation](https://docs.pyth.network/price-feeds/core/upgrade/preparing)
states that the upgrade completed on August 26, 2026 and requires an API key.
Obtain access through [Pyth Terminal](https://pythdata.app). Check available
trial/plan terms in the account; no paid plan has been activated by this work.

Set these in the deployment's secret/environment settings, or in a local
ignored `.env`. Never commit an actual key.

```dotenv
PRICE_PROVIDER=pyth
PYTH_API_KEY=<secret-from-your-account>
PYTH_FEED_MAP_JSON={"<solana-token-mint>":"<verified-64-hex-USD-feed-id>"}
PYTH_MAX_AGE_SECONDS=60
PYTH_TIMEOUT_MS=5000
```

Verify the symbol, quote currency and feed ID in Pyth's official feed catalog.
The example deliberately contains placeholders. Test fixtures use a synthetic
ID and do not supply a production SOL/USD mapping. The default endpoint is
`https://pyth.dourolabs.app/hermes`; response shapes and v2 paths are unchanged
according to the upgrade guide.

```bash
npm install
npx tsx scripts/verify-pyth.ts
npm run dev
```

The verification script performs a real provider call with the configured key
and mappings, prints only quote evidence, and exits nonzero if any mapped
quote is unavailable. Keep the resulting quote evidence, publication time and
commit reference for a reviewer. Test success with mocked data is not proof
that a real Pyth account or deployment is configured.

## Historical requests

Hermes may return an update at or after the requested historical timestamp.
FactLedger rejects a publication later than the requested time to avoid
introducing future information into historical analysis. As a result, some
valid Hermes historical responses intentionally become `UNKNOWN`; this is not
a complete historical valuation service. No wallet USD valuation or PnL
calculation has been newly implemented in this change.

## Verification and remaining activation work

On 2026-09-05 the complete local suite passed: **219 tests in 21 files**;
TypeScript check, lint and build succeeded. REST and a real in-memory MCP
client/server roundtrip are included. These are local results, not a claim
about a future GitHub Actions run.

The existing production health endpoint returned HTTP 200 with
`dependencies.priceProvider: "degraded"`. A real Pyth key, verified feed map,
live provider check and deployment of these changes are still required before
claiming production Pyth integration. No grant submission or award is implied.
