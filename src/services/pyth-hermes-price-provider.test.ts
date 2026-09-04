import { describe, expect, it, vi } from 'vitest';
import { PythHermesPriceProvider, parsePythFeedMap } from './pyth-hermes-price-provider.js';

const MINT = 'So11111111111111111111111111111111111111112';
const FEED_ID = 'ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace';

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
    const provider = new PythHermesPriceProvider({ apiKey: 'test-key', feedMap: { [MINT]: FEED_ID }, fetchImpl });

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
    const provider = new PythHermesPriceProvider({ apiKey: 'test-key', feedMap: { [MINT]: FEED_ID }, fetchImpl });

    const result = await provider.getPrice(MINT, 500);

    expect(result.priceUSD).toBe(100);
    expect(result.confidence).toBe('low');
    expect(String(fetchImpl.mock.calls[0][0])).toContain('/v2/updates/price/500?');
  });

  it('returns UNKNOWN on an HTTP error or malformed price', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, false));
    const provider = new PythHermesPriceProvider({ apiKey: 'test-key', feedMap: { [MINT]: FEED_ID }, fetchImpl });

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
