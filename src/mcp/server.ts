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
  AlertAgent,
  ExplanationAgent,
} from '../agents/core_agents';
import { SolanaRpcClient } from '../services/solana-rpc-client';
import { TransactionRetriever } from '../services/transaction-retriever';
import { BehaviorAnalyzer } from '../services/behavior-analyzer';
import { RiskAssessor } from '../services/risk-assessor';
import { createDefaultDexRegistry } from '../services/dex-registry';
import { InstructionParser } from '../services/instruction-parser';
import { AlertEngine } from '../services/alert-engine';
import { ChainGptClient } from '../services/chaingpt-client';
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
  const dexRegistry = createDefaultDexRegistry(); // Raydium + Jupiter registered - see src/services/dex-registry.ts
  const instructionParser = new InstructionParser(dexRegistry);
  const behaviorAnalyzer = new BehaviorAnalyzer();
  const riskAssessor = new RiskAssessor();

  const txAgent = new TransactionIntelligenceAgent(transactionRetriever, rpcClient, instructionParser);
  const walletAgent = new WalletIntelligenceAgent(transactionRetriever, rpcClient, txAgent);
  const riskAgent = new RiskAgent(transactionRetriever, behaviorAnalyzer, riskAssessor);
  const researchAgent = new ResearchAgent(walletAgent, riskAgent);
  const marketAgent = new MarketEventAgent();
  const alertAgent = new AlertAgent(transactionRetriever, behaviorAnalyzer, riskAssessor, new AlertEngine());
  // See src/services/chaingpt-client.ts for the honest verification-status
  // note on the ChainGPT REST shape this was written against.
  const chainGptClient = new ChainGptClient(process.env.CHAINGPT_API_KEY);
  const explanationAgent = new ExplanationAgent(walletAgent, riskAgent, chainGptClient);

  const server = new McpServer({
    name: 'factledger',
    version: '0.1.0',
  });

  // TS2589 ("Type instantiation is excessively deep and possibly
  // infinite") on the line below: this is the first server.registerTool()
  // call in the file, and removing the callback's redundant explicit
  // parameter type annotation (tried first) only moved the error from the
  // callback to this call site, not away - the recursion is in
  // McpServer.registerTool's own generic resolution against this
  // inputSchema shape, not in anything specific to our code, and every
  // other registerTool call below (same general shape: an object of Zod
  // fields + an async callback) type-checks fine on its own. Suppressing
  // this one, narrowly, with the real TS error code named, rather than
  // guessing further at an SDK whose exact generic internals were never
  // independently verified here (see this file's header comment) -
  // runtime behavior is unaffected; only compile-time checking of this
  // one call is skipped.
  // @ts-expect-error TS2589: excessively deep type instantiation in registerTool's own generics, not this call's arguments
  server.registerTool(
    'wallet_intelligence',
    {
      description:
        'Read-only facts about a Solana wallet: transaction counts, SOL balance, token balances. Returns evidenceStatus UNKNOWN with data: null when the address is invalid or the RPC read fails - never a guessed value.',
      inputSchema: { address: addressParam, limit: limitParam },
    },
    async ({ address, limit }: { address: string; limit?: number }) => jsonResult(await walletAgent.analyzeWallet(address, limit))
  );

  server.registerTool(
    'transaction_lookup',
    {
      description:
        'Look up one Solana transaction by signature: status, fee, block time, and each instruction\'s honest confirmed/candidate/unknown classification (never collapsed into a single "verified" flag).',
      inputSchema: { signature: z.string().describe('Base58 transaction signature') },
    },
    async ({ signature }: { signature: string }) => jsonResult(await txAgent.parseTx(signature))
  );

  server.registerTool(
    'wallet_risk',
    {
      description:
        'Deterministic risk score (0-100) for a Solana wallet, with named factors (failure rate, concentration, volatility, ...) and human-readable reasoning. Not financial advice.',
      inputSchema: { address: addressParam, limit: limitParam },
    },
    async ({ address, limit }: { address: string; limit?: number }) => jsonResult(await riskAgent.evaluateRisk(address, limit))
  );

  server.registerTool(
    'wallet_research_report',
    {
      description:
        'Synthesized wallet + risk summary for a Solana address, built only from the wallet_intelligence and wallet_risk tool outputs - propagates UNKNOWN rather than writing a report around a data gap.',
      inputSchema: { address: addressParam, limit: limitParam },
    },
    async ({ address, limit }: { address: string; limit?: number }) => jsonResult(await researchAgent.generateReport(address, limit))
  );

  server.registerTool(
    'wallet_alerts',
    {
      description:
        'Evaluates a Solana wallet\'s real transaction history against fixed, documented alert thresholds (high failure rate, abnormal frequency, single-program concentration, high risk score). This is a one-shot evaluation, not a live/streaming watch - each alert cites the real numbers that triggered it.',
      inputSchema: { address: addressParam, limit: limitParam },
    },
    async ({ address, limit }: { address: string; limit?: number }) => jsonResult(await alertAgent.evaluateWallet(address, limit))
  );

  server.registerTool(
    'wallet_explanation',
    {
      description:
        'ChainGPT-generated plain-language explanation of a Solana wallet\'s real, already-computed data (transaction counts, risk score, risk reasoning). ChainGPT only rephrases these facts - it never adds new ones. If ChainGPT is unavailable (no CHAINGPT_API_KEY, network/API failure), the summary field falls back to a deterministic sentence built from the same facts, and data.summarySource reports which path was used.',
      inputSchema: { address: addressParam, limit: limitParam },
    },
    async ({ address, limit }: { address: string; limit?: number }) => jsonResult(await explanationAgent.explainWallet(address, limit))
  );

  server.registerTool(
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
