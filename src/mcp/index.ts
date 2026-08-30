/**
 * MCP server entry point - run with `npm run mcp`.
 * Connects over stdio, the standard transport for local MCP clients
 * (Claude Desktop, Claude Code) that spawn the server as a subprocess.
 *
 * See src/mcp/server.ts for the verification-status caveat on the
 * @modelcontextprotocol/sdk API surface used here.
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { buildMcpServer } from './server';

async function main(): Promise<void> {
  const server = buildMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // No console.log here - stdio is the MCP wire protocol itself, and
  // writing plain text to stdout would corrupt it. Use console.error
  // (stderr) for any diagnostic logging in this process.
  console.error('FactLedger MCP server running on stdio');
}

main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
