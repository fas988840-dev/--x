/**
 * MCP (Model Context Protocol) server - exposes the read-only wallet
 * intelligence pipeline as MCP tools, so any MCP-compatible client
 * (Claude Desktop, Claude Code, or another MCP host) can call it directly.
 *
 * ⚠️ VERIFICATION STATUS: written against @modelcontextprotocol/sdk from
 * training knowledge plus one web search result - the official docs
 * (github.com, npmjs.com, modelcontextprotocol.io) were unreachable from
 * this sandbox's network egress proxy when this file was written, so the
 * exact API surface (`registerTool` signature, import paths) is NOT
 * independently verified here. Run `npm install && npm run type-check`
 * before relying on this - small API-name drift (e.g. an SDK method
 * rename) is the likely failure mode, not the overall approach.
 *
 * Every tool below is a pass-through to the honest agents in
 * src/agents/core_agents.ts - same no-fabrication guarantee: a tool
 * result's evidenceStatus is UNKNOWN (never a guess) whenever the
 * underlying data isn't available, and MarketEventAgent always reports
 * UNKNOWN because this codebase has no live event pipeline.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  WalletIntelligenceAgent,
  TransactionIntelligenceAgent,
  MarketEventAgent,
  RiskAgent,
  ResearchAgent,
} from '../agents/core_agents';
import { SolanaRpcClient } from '../services/solana-rpc-client';
import { TransactionRetriever } from '../services/transaction-retriever';
import { BehaviorAnalyzer } from '../services/behavior-analyzer';
import { RiskAssessor } from '../services/risk-assessor';
import { DexRegistry } from '../services/dex-registry';
import { InstructionParser } from '../services/instruction-parser';
import { SolanaConfig } from '../types/config';

const addressParam = z.string().describe('Solana wallet address, base58-encoded');
const limitParam = z.number().int().min(1).max(1000).optional().describe('Max transactions to fetch (default 100, capped at 1000)');

function jsonResult(value: unknown): { content: Array<{ type: 'text'; text: string }> } {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}

/**
 * Builds the MCP server with all tools wired to real, deterministic
 * services (same construction pattern as src/main.ts's HTTP API).
 */
export function buildMcpServer(): McpServer {
  const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
  const solanaConfig: SolanaConfig = {
    rpcUrl,
    commitment: 'confirmed',
    maxRetries: 3,
    retryDelayMs: 1000,
  };

  const rpcClient = new SolanaRpcClient(solanaConfig);
  const transactionRetriever = new TransactionRetriever(rpcClient);
  const dexRegistry = new DexRegistry(); // no adapters registered - see CLAUDE.md
  const instructionParser = new InstructionParser(dexRegistry);
  const behaviorAnalyzer = new BehaviorAnalyzer();
  const riskAssessor = new RiskAssessor();

  const walletAgent = new WalletIntelligenceAgent(transactionRetriever, rpcClient);
  const txAgent = new TransactionIntelligenceAgent(transactionRetriever, rpcClient, instructionParser);
  const riskAgent = new RiskAgent(transactionRetriever, behaviorAnalyzer, riskAssessor);
  const researchAgent = new ResearchAgent(walletAgent, riskAgent);
  const marketAgent = new MarketEventAgent();

  const server = new McpServer({
    name: 'factledger',
    version: '0.1.0',
  });
  const registerTool = server.registerTool.bind(server) as (...args: unknown[]) => unknown;

  registerTool(
    'wallet_intelligence',
    {
      description:
        'Read-only facts about a Solana wallet: transaction counts, SOL balance, token balances. Returns evidenceStatus UNKNOWN with data: null when the address is invalid or the RPC read fails - never a guessed value.',
      inputSchema: { address: addressParam, limit: limitParam },
    },
    async ({ address, limit }: { address: string; limit?: number }) => jsonResult(await walletAgent.analyzeWallet(address, limit))
  );

  registerTool(
    'transaction_lookup',
    {
      description:
        'Look up one Solana transaction by signature: status, fee, block time, and each instruction\'s honest confirmed/candidate/unknown classification (never collapsed into a single "verified" flag).',
      inputSchema: { signature: z.string().describe('Base58 transaction signature') },
    },
    async ({ signature }: { signature: string }) => jsonResult(await txAgent.parseTx(signature))
  );

  registerTool(
    'wallet_risk',
    {
      description:
        'Deterministic risk score (0-100) for a Solana wallet, with named factors (failure rate, concentration, volatility, ...) and human-readable reasoning. Not financial advice.',
      inputSchema: { address: addressParam, limit: limitParam },
    },
    async ({ address, limit }: { address: string; limit?: number }) => jsonResult(await riskAgent.evaluateRisk(address, limit))
  );

  registerTool(
    'wallet_research_report',
    {
      description:
        'Synthesized wallet + risk summary for a Solana address, built only from the wallet_intelligence and wallet_risk tool outputs - propagates UNKNOWN rather than writing a report around a data gap.',
      inputSchema: { address: addressParam, limit: limitParam },
    },
    async ({ address, limit }: { address: string; limit?: number }) => jsonResult(await researchAgent.generateReport(address, limit))
  );

  registerTool(
    'market_events',
    {
      description:
        'Live market/event tracking for a topic. Currently ALWAYS returns evidenceStatus UNKNOWN: this codebase has no live event pipeline (no Geyser plugin, no WebSocket feed) implemented yet - this tool exists so that gap is explicit to callers, not hidden.',
      inputSchema: { topic: z.string() },
    },
    async ({ topic }: { topic: string }) => jsonResult(await marketAgent.trackEvents(topic))
  );

  return server;
}
