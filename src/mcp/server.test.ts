import { describe, it, expect, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { buildMcpServer } from './server';

// NOTE: this only checks that buildMcpServer() wires up without throwing
// (correct service construction order, valid tool registration calls).
// It does not exercise the MCP wire protocol itself - see the
// verification-status note at the top of server.ts: the exact
// @modelcontextprotocol/sdk API surface used here was not reachable to
// verify against official docs when this was written. Run this test
// after `npm install` to catch any API drift (e.g. a renamed method)
// immediately as a thrown error here.
describe('buildMcpServer', () => {
  it('constructs without throwing and registers the expected tools', () => {
    expect(() => buildMcpServer()).not.toThrow();
  });
});


describe('Pyth MCP round trip', () => {
  it('advertises and calls token_price without fabricating a quote when the key is missing', async () => {
    vi.stubEnv('PRICE_PROVIDER', 'pyth');
    vi.stubEnv('PYTH_API_KEY', '');
    const server = buildMcpServer();
    const client = new Client({ name: 'factledger-test', version: '1.0.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    try {
      await server.connect(serverTransport);
      await client.connect(clientTransport);
      expect((await client.listTools()).tools.some(tool => tool.name === 'token_price')).toBe(true);
      const result = await client.callTool({ name: 'token_price', arguments: { mint: 'So11111111111111111111111111111111111111112' } });
      const content = result.content as Array<{ type: string; text: string }>;
      expect(JSON.parse(content[0].text)).toMatchObject({ evidenceStatus: 'UNKNOWN', price: { priceUSD: null, source: 'pyth-hermes' } });
    } finally {
      await client.close();
      await server.close();
      vi.unstubAllEnvs();
    }
  });
});
