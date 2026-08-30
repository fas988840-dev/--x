import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChainGptClient } from './chaingpt-client';

describe('ChainGptClient', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('isConfigured', () => {
    it('is false with no API key', () => {
      expect(new ChainGptClient(undefined).isConfigured()).toBe(false);
    });

    it('is true with an API key', () => {
      expect(new ChainGptClient('secret').isConfigured()).toBe(true);
    });
  });

  describe('generateExplanation', () => {
    it('returns ok:false without calling fetch when no API key is configured', async () => {
      const fetchSpy = vi.fn();
      global.fetch = fetchSpy as unknown as typeof fetch;

      const client = new ChainGptClient(undefined);
      const result = await client.generateExplanation('explain this wallet');

      expect(result).toEqual({ ok: false, reason: 'CHAINGPT_API_KEY is not configured.' });
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('returns ok:false on a non-2xx response', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => '' }) as unknown as typeof fetch;

      const client = new ChainGptClient('secret');
      const result = await client.generateExplanation('explain this wallet');

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toContain('401');
    });

    it('returns ok:false on a network error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('ECONNRESET')) as unknown as typeof fetch;

      const client = new ChainGptClient('secret');
      const result = await client.generateExplanation('explain this wallet');

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toContain('ECONNRESET');
    });

    it('parses a { data: { bot } } JSON envelope (the documented SDK shape)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ data: { bot: 'This wallet shows low activity.' } }),
      }) as unknown as typeof fetch;

      const client = new ChainGptClient('secret');
      const result = await client.generateExplanation('explain this wallet');

      expect(result).toEqual({ ok: true, text: 'This wallet shows low activity.' });
    });

    it('parses a flat { bot } JSON envelope', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ bot: 'Flat shape response.' }),
      }) as unknown as typeof fetch;

      const client = new ChainGptClient('secret');
      const result = await client.generateExplanation('explain this wallet');

      expect(result).toEqual({ ok: true, text: 'Flat shape response.' });
    });

    it('parses SSE-style "data: {...}" chunks and concatenates them', async () => {
      const sse = ['data: {"text":"Hello "}', 'data: {"text":"world."}', 'data: [DONE]'].join('\n');
      global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => sse }) as unknown as typeof fetch;

      const client = new ChainGptClient('secret');
      const result = await client.generateExplanation('explain this wallet');

      expect(result).toEqual({ ok: true, text: 'Hello world.' });
    });

    it('falls back to plain text when the body is not JSON or SSE', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => 'Plain prose response.' }) as unknown as typeof fetch;

      const client = new ChainGptClient('secret');
      const result = await client.generateExplanation('explain this wallet');

      expect(result).toEqual({ ok: true, text: 'Plain prose response.' });
    });

    it('returns ok:false (never a guess) when the body matches no recognized shape', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => JSON.stringify({ unexpected: 'shape' }) }) as unknown as typeof fetch;

      const client = new ChainGptClient('secret');
      const result = await client.generateExplanation('explain this wallet');

      expect(result.ok).toBe(false);
    });

    it('sends the documented request shape with a Bearer auth header', async () => {
      const fetchSpy = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => JSON.stringify({ bot: 'ok' }) });
      global.fetch = fetchSpy as unknown as typeof fetch;

      const client = new ChainGptClient('secret-key');
      await client.generateExplanation('explain this wallet');

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.chaingpt.org/chat/stream',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer secret-key',
            'Content-Type': 'application/json',
          }),
        })
      );
      const body = JSON.parse(fetchSpy.mock.calls[0][1].body as string);
      expect(body).toEqual({ model: 'general_assistant', question: 'explain this wallet', chatHistory: 'off' });
    });
  });
});
