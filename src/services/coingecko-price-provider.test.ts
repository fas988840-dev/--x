import { describe, it, expect, vi, afterEach } from 'vitest';
import { CoinGeckoPriceProvider } from './coingecko-price-provider';

const MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('CoinGeckoPriceProvider', () => {
  it('returns a real price when CoinGecko responds with one', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ [MINT]: { usd: 1.23, last_updated_at: 1_700_000_000 } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const provider = new CoinGeckoPriceProvider();
    const result = await provider.getPrice(MINT);

    expect(result.priceUSD).toBe(1.23);
    expect(result.source).toBe('coingecko');
    expect(result.confidence).toBe('high');
  });

  it('returns null (never a guess) when the token is not in CoinGecko\'s response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal('fetch', fetchMock);

    const provider = new CoinGeckoPriceProvider();
    const result = await provider.getPrice(MINT);

    expect(result.priceUSD).toBeNull();
    expect(result.confidence).toBe('unknown');
  });

  it('returns null on a non-ok response (e.g. rate limited) instead of throwing', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({}) });
    vi.stubGlobal('fetch', fetchMock);

    const provider = new CoinGeckoPriceProvider();
    const result = await provider.getPrice(MINT);

    expect(result.priceUSD).toBeNull();
  });

  it('returns null on a network error instead of throwing', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    vi.stubGlobal('fetch', fetchMock);

    const provider = new CoinGeckoPriceProvider();
    const result = await provider.getPrice(MINT);

    expect(result.priceUSD).toBeNull();
  });

  it('refuses to serve a stale historical timestamp as if it were current price', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const provider = new CoinGeckoPriceProvider();
    const longAgo = Math.floor(Date.now() / 1000) - 10_000;
    const result = await provider.getPrice(MINT, longAgo);

    expect(result.priceUSD).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled(); // never even asks CoinGecko for a historical price it can't serve
  });

  it('batches multiple mints into a single request', async () => {
    const mint2 = 'So11111111111111111111111111111111111111112';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ [MINT]: { usd: 1.0 }, [mint2]: { usd: 200 } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const provider = new CoinGeckoPriceProvider();
    const results = await provider.getPrices([MINT, mint2]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(results).toHaveLength(2);
    expect(results[0].priceUSD).toBe(1.0);
    expect(results[1].priceUSD).toBe(200);
  });
});
