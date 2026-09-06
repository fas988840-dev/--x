/**
 * CoinGecko-backed PriceProvider - the real price integration referenced
 * as a TODO in price-provider.ts / README.md's roadmap.
 *
 * Uses CoinGecko's free, public `/simple/token_price/solana` endpoint
 * (no API key required, https://docs.coingecko.com/reference/simple-token-price).
 * Same no-fabrication contract as everywhere else: any failure (network
 * error, rate limit, token not listed on CoinGecko, or a requested
 * historical timestamp - this endpoint only serves current price) returns
 * `priceUSD: null` with an honest `confidence`/`source`, never a guess.
 */

import { PriceProvider, PriceResult } from './price-provider.js';

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
const MAX_STALE_SECONDS = 5 * 60; // how far "now" a requested timestamp may be and still be served by this endpoint
const HEALTH_CACHE_MS = 60_000;

interface CoinGeckoTokenPriceResponse {
  [contractAddress: string]: { usd?: number; last_updated_at?: number } | undefined;
}

function unavailable(mint: string, timestamp: number): PriceResult {
  return { mint, priceUSD: null, timestamp, source: 'coingecko', confidence: 'unknown' };
}

export class CoinGeckoPriceProvider implements PriceProvider {
  private healthCache: { checkedAt: number; healthy: boolean } | null = null;

  async getPrice(mint: string, timestamp?: number): Promise<PriceResult> {
    const results = await this.getPrices([mint], timestamp);
    return results[0];
  }

  async getPrices(mints: string[], timestamp?: number): Promise<PriceResult[]> {
    const now = Math.floor(Date.now() / 1000);
    const ts = timestamp ?? now;

    if (mints.length === 0) return [];

    // This endpoint only serves the current price - never fabricate a
    // historical one by silently substituting "now" for a real past request.
    if (Math.abs(now - ts) > MAX_STALE_SECONDS) {
      return mints.map((mint) => unavailable(mint, ts));
    }

    try {
      const url = `${COINGECKO_BASE_URL}/simple/token_price/solana?contract_addresses=${encodeURIComponent(mints.join(','))}&vs_currencies=usd`;
      const response = await fetch(url);

      if (!response.ok) {
        // Includes 429 (rate limited) - honestly unavailable, not a guess.
        return mints.map((mint) => unavailable(mint, ts));
      }

      const data = (await response.json()) as CoinGeckoTokenPriceResponse;

      return mints.map((mint) => {
        // CoinGecko's response keys aren't guaranteed to match the
        // requested address's exact casing - try exact, then
        // case-insensitive, before giving up honestly.
        const entry = data[mint] ?? Object.entries(data).find(([key]) => key.toLowerCase() === mint.toLowerCase())?.[1];

        if (!entry || typeof entry.usd !== 'number') {
          return unavailable(mint, ts);
        }

        return {
          mint,
          priceUSD: entry.usd,
          timestamp: entry.last_updated_at ?? now,
          source: 'coingecko',
          confidence: 'high' as const,
        };
      });
    } catch {
      // Network error, JSON parse failure, etc.
      return mints.map((mint) => unavailable(mint, ts));
    }
  }

  async isHealthy(): Promise<boolean> {
    const now = Date.now();
    if (this.healthCache && now - this.healthCache.checkedAt < HEALTH_CACHE_MS) {
      return this.healthCache.healthy;
    }

    let healthy = false;
    try {
      const response = await fetch(`${COINGECKO_BASE_URL}/ping`);
      healthy = response.ok;
    } catch {
      healthy = false;
    }

    // Render calls /api/v1/health every few seconds. Without caching, each
    // liveness request fans out to CoinGecko and can rate-limit the provider
    // we are trying to monitor. Cache the dependency result for one minute so
    // health checks observe CoinGecko without creating their own degradation.
    this.healthCache = { checkedAt: now, healthy };
    return healthy;
  }
}
