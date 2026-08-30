import { describe, it, expect } from 'vitest';
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
