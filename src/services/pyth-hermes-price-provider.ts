import { PriceProvider, PriceResult } from './price-provider.js';

const BASE_URL = 'https://pyth.dourolabs.app/hermes';
const FEED_ID = /^(?:0x)?[0-9a-f]{64}$/i;

export interface PythHermesPriceProviderOptions {
  apiKey?: string;
  feedMap?: Record<string, string>;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  maxAgeSeconds?: number;
  timeoutMs?: number;
  now?: () => number;
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function feedId(value: unknown): string | undefined {
  return typeof value === 'string' && FEED_ID.test(value)
    ? value.toLowerCase().replace(/^0x/, '') : undefined;
}

function validMap(value: unknown): Record<string, string> {
  if (!record(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([mint, id]) => {
    const normalized = feedId(id);
    return mint.trim() && normalized ? [[mint, normalized]] : [];
  }));
}

export function parsePythFeedMap(raw: string | undefined): Record<string, string> {
  try { return raw ? validMap(JSON.parse(raw)) : {}; } catch { return {}; }
}

function unavailable(mint: string, timestamp: number): PriceResult {
  return { mint, priceUSD: null, timestamp, source: 'pyth-hermes', confidence: 'unknown' };
}

function parsePrice(value: unknown, asOf: number, maxAge: number): Omit<PriceResult, 'mint' | 'source'> | null {
  if (!record(value) || typeof value.price !== 'string' || !/^\d+$/.test(value.price)
    || typeof value.conf !== 'string' || !/^\d+$/.test(value.conf)
    || typeof value.expo !== 'number' || !Number.isSafeInteger(value.expo)
    || typeof value.publish_time !== 'number' || !Number.isSafeInteger(value.publish_time)
    || value.publish_time <= 0 || value.publish_time > asOf || asOf - value.publish_time > maxAge) return null;
  const integerPrice = Number(value.price);
  const integerConfidence = Number(value.conf);
  if (!Number.isSafeInteger(integerPrice) || !Number.isSafeInteger(integerConfidence)) return null;
  const scale = 10 ** value.expo;
  const priceUSD = integerPrice * scale;
  const confidenceIntervalUSD = integerConfidence * scale;
  if (!Number.isFinite(scale) || scale <= 0 || !Number.isFinite(priceUSD) || priceUSD <= 0
    || !Number.isFinite(confidenceIntervalUSD)) return null;
  const ratio = confidenceIntervalUSD / priceUSD;
  return { priceUSD, confidenceIntervalUSD, timestamp: value.publish_time,
    confidence: ratio <= 0.02 ? 'high' : ratio <= 0.05 ? 'medium' : 'low' };
}

/**
 * Parses Hermes v2 responses; does not locally verify a signature/on-chain account.
 * Operators must verify each explicit mint -> USD feed mapping in Pyth's catalog.
 * Historical Hermes can return a price AFTER the requested timestamp. Reject it
 * rather than silently introducing future information into historical analysis.
 */
export class PythHermesPriceProvider implements PriceProvider {
  private readonly apiKey?: string;
  private readonly feedMap: Record<string, string>;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly maxAgeSeconds: number;
  private readonly timeoutMs: number;
  private readonly now: () => number;

  constructor(options: PythHermesPriceProviderOptions = {}) {
    this.apiKey = options.apiKey?.trim();
    this.feedMap = validMap(options.feedMap);
    this.baseUrl = (options.baseUrl ?? BASE_URL).replace(/\/$/, '');
    const url = new URL(this.baseUrl);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
      throw new Error('Pyth baseUrl must be HTTPS without credentials, query, or fragment');
    }
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.maxAgeSeconds = options.maxAgeSeconds ?? 60;
    this.timeoutMs = options.timeoutMs ?? 5000;
    this.now = options.now ?? ((): number => Math.floor(Date.now() / 1000));
    if (!Number.isSafeInteger(this.maxAgeSeconds) || this.maxAgeSeconds < 0
      || !Number.isSafeInteger(this.timeoutMs) || this.timeoutMs < 1) {
      throw new Error('Pyth age and timeout limits must be valid integers');
    }
  }

  async getPrice(mint: string, timestamp?: number): Promise<PriceResult> {
    return (await this.getPrices([mint], timestamp))[0];
  }

  async getPrices(mints: string[], timestamp?: number): Promise<PriceResult[]> {
    const now = this.now();
    const asOf = timestamp ?? now;
    const unknown = (): PriceResult[] => mints.map((mint) => unavailable(mint, asOf));
    if (mints.length === 0) return [];
    if (!Number.isSafeInteger(asOf) || asOf <= 0 || asOf > now || !this.apiKey) return unknown();
    const ids = [...new Set(mints.map((mint) => this.feedMap[mint]).filter((id) => typeof id === 'string'))];
    if (ids.length === 0) return unknown();
    const params = new URLSearchParams({ parsed: 'true' });
    for (const id of ids) params.append('ids[]', id);
    const path = timestamp === undefined ? '/v2/updates/price/latest' : `/v2/updates/price/${asOf}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(`${this.baseUrl}${path}?${params}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` }, signal: controller.signal, redirect: 'error',
      });
      if (!response.ok) return unknown();
      const body: unknown = await response.json();
      if (!record(body) || !Array.isArray(body.parsed)) return unknown();
      const updates = new Map<string, unknown>();
      for (const item of body.parsed) {
        if (!record(item)) continue;
        const id = feedId(item.id);
        if (id && ids.includes(id)) updates.set(id, updates.has(id) ? null : item.price);
      }
      // A latest update may be published while the network request is in flight.
      const observedAt = timestamp === undefined ? this.now() : asOf;
      return mints.map((mint) => {
        const id = this.feedMap[mint];
        const price = parsePrice(updates.get(id), observedAt, this.maxAgeSeconds);
        return price ? { mint, source: 'pyth-hermes', feedId: id, ...price } : unavailable(mint, asOf);
      });
    } catch { return unknown(); } finally { clearTimeout(timer); }
  }

  async isHealthy(): Promise<boolean> {
    const mints = Object.keys(this.feedMap);
    if (!this.apiKey || mints.length === 0) return false;
    return (await this.getPrices(mints)).some((price) => price.priceUSD !== null);
  }
}
