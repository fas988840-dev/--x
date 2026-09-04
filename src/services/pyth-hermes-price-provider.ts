import { PriceProvider, PriceResult } from './price-provider.js';

const DEFAULT_HERMES_BASE_URL = 'https://pyth.dourolabs.app/hermes';

interface PythPriceValue {
  price: string;
  conf: string;
  expo: number;
  publish_time: number;
}

interface PythParsedUpdate {
  id: string;
  price?: PythPriceValue;
}

interface PythHermesResponse {
  parsed?: PythParsedUpdate[];
}

export interface PythHermesPriceProviderOptions {
  apiKey?: string;
  feedMap?: Record<string, string>;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

function unavailable(mint: string, timestamp: number): PriceResult {
  return {
    mint,
    priceUSD: null,
    timestamp,
    source: 'pyth-hermes',
    confidence: 'unknown',
  };
}

function normalizeFeedId(feedId: string): string {
  return feedId.toLowerCase().replace(/^0x/, '');
}

function parsePrice(value: PythPriceValue): { priceUSD: number; confidence: PriceResult['confidence'] } | null {
  const integerPrice = Number(value.price);
  const integerConfidence = Number(value.conf);
  if (!Number.isFinite(integerPrice) || !Number.isFinite(integerConfidence)) return null;

  const scale = 10 ** value.expo;
  const priceUSD = integerPrice * scale;
  const confidenceUSD = Math.abs(integerConfidence * scale);
  if (!Number.isFinite(priceUSD) || priceUSD <= 0 || !Number.isFinite(confidenceUSD)) return null;

  const ratio = confidenceUSD / Math.abs(priceUSD);
  const confidence: PriceResult['confidence'] = ratio <= 0.02 ? 'high' : ratio <= 0.05 ? 'medium' : 'low';
  return { priceUSD, confidence };
}

export function parsePythFeedMap(raw: string | undefined): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    const result: Record<string, string> = {};
    for (const [mint, feedId] of Object.entries(parsed)) {
      if (typeof feedId === 'string' && mint.trim() && /^[0-9a-fA-Fx]{64,66}$/.test(feedId)) {
        result[mint] = normalizeFeedId(feedId);
      }
    }
    return result;
  } catch {
    return {};
  }
}

/**
 * Pyth Core price provider backed by the official Hermes v2 API.
 *
 * Pyth feed IDs are not derivable from Solana token mint addresses, so the
 * mapping is explicit. Unmapped mints or any unavailable/invalid response
 * return UNKNOWN instead of falling back to a fabricated price.
 */
export class PythHermesPriceProvider implements PriceProvider {
  private readonly apiKey?: string;
  private readonly feedMap: Record<string, string>;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: PythHermesPriceProviderOptions = {}) {
    this.apiKey = options.apiKey;
    this.feedMap = options.feedMap ?? {};
    this.baseUrl = (options.baseUrl ?? DEFAULT_HERMES_BASE_URL).replace(/\/$/, '');
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async getPrice(mint: string, timestamp?: number): Promise<PriceResult> {
    const results = await this.getPrices([mint], timestamp);
    return results[0];
  }

  async getPrices(mints: string[], timestamp?: number): Promise<PriceResult[]> {
    const requestedTimestamp = timestamp ?? Math.floor(Date.now() / 1000);
    if (mints.length === 0) return [];

    const mapped = mints
      .map((mint) => ({ mint, feedId: this.feedMap[mint] }))
      .filter((item): item is { mint: string; feedId: string } => typeof item.feedId === 'string');

    if (!this.apiKey || mapped.length === 0) {
      return mints.map((mint) => unavailable(mint, requestedTimestamp));
    }

    const path = timestamp === undefined ? '/v2/updates/price/latest' : `/v2/updates/price/${requestedTimestamp}`;
    const params = new URLSearchParams();
    for (const { feedId } of mapped) params.append('ids[]', normalizeFeedId(feedId));
    params.set('parsed', 'true');

    try {
      const response = await this.fetchImpl(`${this.baseUrl}${path}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      if (!response.ok) return mints.map((mint) => unavailable(mint, requestedTimestamp));

      const body = (await response.json()) as PythHermesResponse;
      const parsedById = new Map((body.parsed ?? []).map((item) => [normalizeFeedId(item.id), item]));

      return mints.map((mint) => {
        const feedId = this.feedMap[mint];
        if (!feedId) return unavailable(mint, requestedTimestamp);
        const update = parsedById.get(normalizeFeedId(feedId));
        if (!update?.price) return unavailable(mint, requestedTimestamp);

        const parsed = parsePrice(update.price);
        if (!parsed) return unavailable(mint, requestedTimestamp);

        return {
          mint,
          priceUSD: parsed.priceUSD,
          timestamp: update.price.publish_time,
          source: 'pyth-hermes',
          confidence: parsed.confidence,
        };
      });
    } catch {
      return mints.map((mint) => unavailable(mint, requestedTimestamp));
    }
  }

  async isHealthy(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const response = await this.fetchImpl(`${this.baseUrl}/v2/price_feeds?query=sol&asset_type=crypto`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
