/**
 * Real current-price provider chain for Solana tokens.
 *
 * Primary: CoinGecko aggregated token price.
 * Fallback 1: GeckoTerminal keyless onchain token price.
 * Fallback 2: DEX Screener public token-pairs API.
 *
 * The fallbacks exist because keyless public APIs can rate-limit shared cloud
 * egress IPs. FactLedger never fabricates a replacement price: if every
 * provider is unavailable or the token cannot be priced, priceUSD stays null.
 * Historical requests are never silently replaced with a current quote.
 */

import { PriceProvider, PriceResult } from './price-provider.js';
import { logger } from '../utils/logger.js';

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
const GECKOTERMINAL_BASE_URL = 'https://api.geckoterminal.com/api/v2';
const DEXSCREENER_BASE_URL = 'https://api.dexscreener.com';
const MAX_STALE_SECONDS = 5 * 60;
const HEALTH_CACHE_MS = 60_000;

interface CoinGeckoTokenPriceResponse {
  [contractAddress: string]: { usd?: number; last_updated_at?: number } | undefined;
}

interface GeckoTerminalTokenPriceResponse {
  data?: {
    attributes?: {
      token_prices?: Record<string, string | null | undefined>;
    };
  };
}

interface DexScreenerPair {
  chainId?: string;
  baseToken?: { address?: string };
  quoteToken?: { address?: string };
  priceUsd?: string | null;
  liquidity?: { usd?: number | null } | null;
}

function unavailable(
  mint: string,
  timestamp: number,
  source = 'coingecko/geckoterminal/dexscreener'
): PriceResult {
  return { mint, priceUSD: null, timestamp, source, confidence: 'unknown' };
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

    if (Math.abs(now - ts) > MAX_STALE_SECONDS) {
      return mints.map((mint) => unavailable(mint, ts));
    }

    let results = await this.fetchCoinGecko(mints, now, ts);
    results = await this.fillMissing(
      mints,
      results,
      (missingMints) => this.fetchGeckoTerminal(missingMints, now, ts)
    );
    results = await this.fillMissing(
      mints,
      results,
      (missingMints) => this.fetchDexScreener(missingMints, now, ts)
    );

    return results;
  }

  private async fillMissing(
    mints: string[],
    current: PriceResult[],
    fetchFallback: (mints: string[]) => Promise<PriceResult[]>
  ): Promise<PriceResult[]> {
    const missingIndexes = current
      .map((result, index) => ({ result, index }))
      .filter(({ result }) => result.priceUSD === null)
      .map(({ index }) => index);

    if (missingIndexes.length === 0) return current;

    const fallbackMints = missingIndexes.map((index) => mints[index]);
    const fallback = await fetchFallback(fallbackMints);
    const merged = [...current];

    missingIndexes.forEach((originalIndex, fallbackIndex) => {
      const candidate = fallback[fallbackIndex];
      if (candidate && candidate.priceUSD !== null) {
        merged[originalIndex] = candidate;
      }
    });

    return merged;
  }

  private async fetchCoinGecko(mints: string[], now: number, ts: number): Promise<PriceResult[]> {
    try {
      const url = `${COINGECKO_BASE_URL}/simple/token_price/solana?contract_addresses=${encodeURIComponent(mints.join(','))}&vs_currencies=usd&include_last_updated_at=true`;
      const response = await fetch(url, { headers: this.headers() });

      if (!response.ok) {
        logger.warn(`CoinGecko price request failed: HTTP ${response.status}; trying fallback`);
        return mints.map((mint) => unavailable(mint, ts, 'coingecko'));
      }

      const data = (await response.json()) as CoinGeckoTokenPriceResponse;
      return mints.map((mint) => {
        const entry =
          data[mint] ??
          Object.entries(data).find(([key]) => key.toLowerCase() === mint.toLowerCase())?.[1];

        if (!entry || typeof entry.usd !== 'number' || !Number.isFinite(entry.usd)) {
          return unavailable(mint, ts, 'coingecko');
        }

        return {
          mint,
          priceUSD: entry.usd,
          timestamp: entry.last_updated_at ?? now,
          source: 'coingecko',
          confidence: 'high' as const,
        };
      });
    } catch (error) {
      logger.warn(
        `CoinGecko price request error: ${error instanceof Error ? error.message : 'unknown error'}; trying fallback`
      );
      return mints.map((mint) => unavailable(mint, ts, 'coingecko'));
    }
  }

  private async fetchGeckoTerminal(
    mints: string[],
    now: number,
    ts: number
  ): Promise<PriceResult[]> {
    if (mints.length === 0) return [];

    try {
      const addresses = encodeURIComponent(mints.join(','));
      const url = `${GECKOTERMINAL_BASE_URL}/simple/networks/solana/token_price/${addresses}`;
      const response = await fetch(url, { headers: this.headers() });

      if (!response.ok) {
        logger.warn(`GeckoTerminal price fallback failed: HTTP ${response.status}`);
        return mints.map((mint) => unavailable(mint, ts, 'geckoterminal'));
      }

      const data = (await response.json()) as GeckoTerminalTokenPriceResponse;
      const prices = data.data?.attributes?.token_prices ?? {};

      return mints.map((mint) => {
        const raw =
          prices[mint] ??
          Object.entries(prices).find(([key]) => key.toLowerCase() === mint.toLowerCase())?.[1];
        const price = typeof raw === 'string' ? Number(raw) : Number.NaN;

        if (!Number.isFinite(price)) {
          return unavailable(mint, ts, 'geckoterminal');
        }

        return {
          mint,
          priceUSD: price,
          timestamp: now,
          source: 'geckoterminal',
          confidence: 'medium' as const,
        };
      });
    } catch (error) {
      logger.warn(
        `GeckoTerminal price fallback error: ${error instanceof Error ? error.message : 'unknown error'}`
      );
      return mints.map((mint) => unavailable(mint, ts, 'geckoterminal'));
    }
  }

  private async fetchDexScreener(
    mints: string[],
    now: number,
    ts: number
  ): Promise<PriceResult[]> {
    if (mints.length === 0) return [];

    try {
      const addresses = encodeURIComponent(mints.join(','));
      const url = `${DEXSCREENER_BASE_URL}/tokens/v1/solana/${addresses}`;
      const response = await fetch(url, { headers: this.headers() });

      if (!response.ok) {
        logger.warn(`DEX Screener price fallback failed: HTTP ${response.status}`);
        return mints.map((mint) => unavailable(mint, ts, 'dexscreener'));
      }

      const pairs = (await response.json()) as DexScreenerPair[];
      if (!Array.isArray(pairs)) {
        return mints.map((mint) => unavailable(mint, ts, 'dexscreener'));
      }

      return mints.map((mint) => {
        const candidates = pairs
          .filter(
            (pair) =>
              pair.chainId === 'solana' &&
              pair.baseToken?.address?.toLowerCase() === mint.toLowerCase() &&
              typeof pair.priceUsd === 'string'
          )
          .map((pair) => ({
            pair,
            liquidity: pair.liquidity?.usd ?? 0,
          }))
          .sort((a, b) => b.liquidity - a.liquidity);

        const raw = candidates[0]?.pair.priceUsd;
        const price = typeof raw === 'string' ? Number(raw) : Number.NaN;

        if (!Number.isFinite(price)) {
          return unavailable(mint, ts, 'dexscreener');
        }

        return {
          mint,
          priceUSD: price,
          timestamp: now,
          source: 'dexscreener',
          confidence: 'medium' as const,
        };
      });
    } catch (error) {
      logger.warn(
        `DEX Screener price fallback error: ${error instanceof Error ? error.message : 'unknown error'}`
      );
      return mints.map((mint) => unavailable(mint, ts, 'dexscreener'));
    }
  }

  async isHealthy(): Promise<boolean> {
    const now = Date.now();
    if (this.healthCache && now - this.healthCache.checkedAt < HEALTH_CACHE_MS) {
      return this.healthCache.healthy;
    }

    let healthy = await this.checkUrl(`${COINGECKO_BASE_URL}/ping`, 'CoinGecko');
    if (!healthy) {
      healthy = await this.checkUrl(`${GECKOTERMINAL_BASE_URL}/networks`, 'GeckoTerminal');
    }
    if (!healthy) {
      healthy = await this.checkUrl(
        `${DEXSCREENER_BASE_URL}/latest/dex/search?q=${encodeURIComponent('SOL/USDC')}`,
        'DEX Screener'
      );
    }

    this.healthCache = { checkedAt: now, healthy };
    return healthy;
  }

  private headers(): Record<string, string> {
    return {
      accept: 'application/json',
      'user-agent': 'FactLedger/0.1.0',
    };
  }

  private async checkUrl(url: string, provider: string): Promise<boolean> {
    try {
      const response = await fetch(url, { headers: this.headers() });
      if (!response.ok) {
        logger.warn(`${provider} health check failed: HTTP ${response.status}`);
      }
      return response.ok;
    } catch (error) {
      logger.warn(
        `${provider} health check error: ${error instanceof Error ? error.message : 'unknown error'}`
      );
      return false;
    }
  }
}
