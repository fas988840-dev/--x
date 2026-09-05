import { describe, expect, it, vi } from 'vitest';
import { PythHermesPriceProvider, parsePythFeedMap } from './pyth-hermes-price-provider.js';

const MINT = 'So11111111111111111111111111111111111111112';
// Synthetic feed identifier for mocked responses; not a real mint/feed mapping.
const FEED_ID = 'a'.repeat(64);

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as Response;
}

describe('PythHermesPriceProvider', () => {
  it('returns an honest UNKNOWN result without an API key', async () => {
    const fetchImpl = vi.fn();
    const provider = new PythHermesPriceProvider({ feedMap: { [MINT]: FEED_ID }, fetchImpl });

    const result = await provider.getPrice(MINT, 100);

    expect(result).toEqual({
      mint: MINT,
      priceUSD: null,
      timestamp: 100,
      source: 'pyth-hermes',
      confidence: 'unknown',
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns UNKNOWN for an unmapped mint instead of guessing a feed id', async () => {
    const fetchImpl = vi.fn();
    const provider = new PythHermesPriceProvider({ apiKey: 'test-key', feedMap: {}, fetchImpl });

    const result = await provider.getPrice(MINT, 100);

    expect(result.priceUSD).toBeNull();
    expect(result.confidence).toBe('unknown');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('parses a valid Pyth price and uses the publish time', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        parsed: [
          {
            id: FEED_ID,
            price: { price: '184136023127', conf: '177166324', expo: -8, publish_time: 1234 },
          },
        ],
      })
    );
    const provider = new PythHermesPriceProvider({ apiKey: 'test-key', feedMap: { [MINT]: FEED_ID }, fetchImpl, now: (): number => 1234 });

    const result = await provider.getPrice(MINT);

    expect(result.priceUSD).toBeCloseTo(1841.36023127);
    expect(result.timestamp).toBe(1234);
    expect(result.source).toBe('pyth-hermes');
    expect(result.confidence).toBe('high');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('uses the historical Hermes endpoint when a timestamp is requested', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        parsed: [
          {
            id: FEED_ID,
            price: { price: '10000', conf: '1000', expo: -2, publish_time: 500 },
          },
        ],
      })
    );
    const provider = new PythHermesPriceProvider({ apiKey: 'test-key', feedMap: { [MINT]: FEED_ID }, fetchImpl, now: (): number => 1234 });

    const result = await provider.getPrice(MINT, 500);

    expect(result.priceUSD).toBe(100);
    expect(result.confidence).toBe('low');
    expect(String(fetchImpl.mock.calls[0][0])).toContain('/v2/updates/price/500?');
  });

  it('returns UNKNOWN on an HTTP error or malformed price', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, false));
    const provider = new PythHermesPriceProvider({ apiKey: 'test-key', feedMap: { [MINT]: FEED_ID }, fetchImpl, now: (): number => 1234 });

    const result = await provider.getPrice(MINT, 100);

    expect(result.priceUSD).toBeNull();
    expect(result.confidence).toBe('unknown');
  });
});

describe('parsePythFeedMap', () => {
  it('accepts only explicit feed ids and normalizes 0x prefixes', () => {
    expect(parsePythFeedMap(JSON.stringify({ [MINT]: `0x${FEED_ID}`, bad: 'not-a-feed-id' }))).toEqual({
      [MINT]: FEED_ID,
    });
  });

  it('returns an empty map for invalid JSON', () => {
    expect(parsePythFeedMap('{')).toEqual({});
  });
});


describe('Pyth response integrity', () => {
  function provider(price: unknown, extra: Record<string, unknown> = {}): PythHermesPriceProvider {
    return new PythHermesPriceProvider({ apiKey: 'test-only', feedMap: { [MINT]: FEED_ID }, now: (): number => 1000,
      fetchImpl: vi.fn().mockResolvedValue(jsonResponse({ parsed: [{ id: FEED_ID, price }] })), ...extra });
  }
  const valid = { price: '12300', conf: '100', expo: -2, publish_time: 1000 };

  it.each([
    ['stale', { ...valid, publish_time: 939 }],
    ['future', { ...valid, publish_time: 1001 }],
    ['negative confidence', { ...valid, conf: '-1' }],
    ['lossy integer', { ...valid, price: '9007199254740993' }],
    ['missing time', { price: '123', conf: '1', expo: -2 }],
    ['invalid exponent', { ...valid, expo: null }],
    ['zero', { ...valid, price: '0' }],
    ['empty', null],
  ])('rejects %s data', async (_label, price) => {
    expect((await provider(price).getPrice(MINT)).priceUSD).toBeNull();
  });

  it('does not use a later publication for historical valuation', async () => {
    expect((await provider({ ...valid, publish_time: 501 }).getPrice(MINT, 500)).priceUSD).toBeNull();
    expect((await provider({ ...valid, publish_time: 500 }).getPrice(MINT, 500)).priceUSD).toBe(123);
  });

  it('accepts a latest update published while the request is in flight', async () => {
    const now = vi.fn().mockReturnValueOnce(1000).mockReturnValue(1001);
    expect((await provider({ ...valid, publish_time: 1001 }, { now }).getPrice(MINT)).priceUSD).toBe(123);
  });

  it('keeps the returned uncertainty interval and explicit feed ID', async () => {
    expect(await provider(valid).getPrice(MINT)).toMatchObject({ confidenceIntervalUSD: 1, feedId: FEED_ID, timestamp: 1000 });
  });

  it('deduplicates feed requests and preserves caller order and unknown mints', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ parsed: [null, { id: FEED_ID, price: valid }] }));
    const prices = await provider(valid, { fetchImpl }).getPrices([MINT, 'unmapped', MINT]);
    expect(prices.map(p => p.priceUSD)).toEqual([123, null, 123]);
    const url = new URL(fetchImpl.mock.calls[0][0]);
    expect(url.searchParams.getAll('ids[]')).toEqual([FEED_ID]);
    expect(fetchImpl.mock.calls[0][1]).toMatchObject({ redirect: 'error', headers: { Authorization: 'Bearer test-only' } });
  });

  it('aborts a stalled request and returns UNKNOWN', async () => {
    const fetchImpl: typeof fetch = vi.fn((_url, options) => new Promise((_resolve, reject) => {
      options?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
    }));
    expect((await provider(valid, { fetchImpl, timeoutMs: 5 }).getPrice(MINT)).priceUSD).toBeNull();
  });

  it('reports unhealthy when no usable mapped quote exists', async () => {
    expect(await provider({ ...valid, publish_time: 1 }).isHealthy()).toBe(false);
    expect(await provider(valid).isHealthy()).toBe(true);
  });

  it('rejects malformed feed IDs, including constructor mappings', async () => {
    const malformed = 'x'.repeat(64);
    expect(parsePythFeedMap(JSON.stringify({ [MINT]: malformed }))).toEqual({});
    expect((await provider(valid, { feedMap: { [MINT]: malformed } }).getPrice(MINT)).priceUSD).toBeNull();
  });
});
