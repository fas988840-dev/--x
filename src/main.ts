/**
 * Main application entry point
 * Sets up and starts the API server
 */

import { SolanaConfig } from './types/config';
import { SolanaRpcClient } from './services/solana-rpc-client';
import { TransactionRetriever } from './services/transaction-retriever';
import { BehaviorAnalyzer } from './services/behavior-analyzer';
import { IntelligenceScorer } from './services/intelligence-scorer';
import { RiskAssessor } from './services/risk-assessor';
import { PriceProvider, StubPriceProvider } from './services/price-provider';
import { CoinGeckoPriceProvider } from './services/coingecko-price-provider';
import { createDefaultDexRegistry } from './services/dex-registry';
import { InstructionParser } from './services/instruction-parser';
import { APIServer } from './api/server';
import { WalletIntelligenceAgent, TransactionIntelligenceAgent, RiskAgent, ResearchAgent, MarketEventAgent, AlertAgent, ExplanationAgent } from './agents/core_agents';
import { EvidenceEngine } from './agents/evidence-engine';
import { AlertEngine } from './services/alert-engine';
import { LiveAlertWatcher } from './services/live-alert-watcher';
import { ChainGptClient } from './services/chaingpt-client';
import { AgentRouter } from './agents/agent-router';

/**
 * Initialize and start the application
 */
async function main(): Promise<void> {
  const port = parseInt(process.env.PORT || '3000', 10);
  const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

  console.log('Initializing FactLedger...');
  console.log(`RPC URL: ${rpcUrl}`);
  console.log(`Port: ${port}`);

  // Initialize services
  const solanaConfig: SolanaConfig = {
    rpcUrl,
    commitment: 'confirmed',
    maxRetries: 3,
    retryDelayMs: 1000,
  };

  const rpcClient = new SolanaRpcClient(solanaConfig);
  const transactionRetriever = new TransactionRetriever(rpcClient);
  // Raydium AMM V4 + Jupiter V6 registered under verified program IDs - see
  // src/services/dex-registry.ts for what's verified vs. still unknown.
  const dexRegistry = createDefaultDexRegistry();
  const instructionParser = new InstructionParser(dexRegistry);
  const behaviorAnalyzer = new BehaviorAnalyzer();
  const intelligenceScorer = new IntelligenceScorer();
  const riskAssessor = new RiskAssessor();
  // PRICE_PROVIDER=stub opts back into the always-null stub (useful
  // offline/in tests); anything else (default) uses the real CoinGecko
  // integration - see src/services/coingecko-price-provider.ts.
  const priceProvider: PriceProvider =
    process.env.PRICE_PROVIDER === 'stub' ? new StubPriceProvider() : new CoinGeckoPriceProvider();

  // Agents - thin, honest facades over the services above (see
  // src/agents/core_agents.ts and CLAUDE.md)
  const txAgent = new TransactionIntelligenceAgent(transactionRetriever, rpcClient, instructionParser);
  // WalletIntelligenceAgent depends on TransactionIntelligenceAgent for its
  // (bounded, RPC-cost-conscious) real protocol detection - see
  // WalletIntelligenceAgent.detectKnownProtocols() in core_agents.ts.
  const walletAgent = new WalletIntelligenceAgent(transactionRetriever, rpcClient, txAgent);
  const riskAgent = new RiskAgent(transactionRetriever, behaviorAnalyzer, riskAssessor);
  const researchAgent = new ResearchAgent(walletAgent, riskAgent);
  const evidenceEngine = new EvidenceEngine(transactionRetriever, txAgent);
  const marketAgent = new MarketEventAgent();
  const alertEngine = new AlertEngine();
  const alertAgent = new AlertAgent(transactionRetriever, behaviorAnalyzer, riskAssessor, alertEngine);
  // Live/streaming counterpart to alertAgent's one-shot evaluation - see
  // src/services/live-alert-watcher.ts for the verification-status note
  // (Solana RPC was blocked from this sandbox, so onLogs is unexercised).
  const liveAlertWatcher = new LiveAlertWatcher(rpcClient, transactionRetriever, behaviorAnalyzer, riskAssessor, alertEngine);
  // ChainGPT integration - explanation-only, see src/services/chaingpt-client.ts
  // for the honest verification-status note on its REST shape. Reads
  // CHAINGPT_API_KEY from the environment only; never logged, never
  // required (ExplanationAgent falls back to a deterministic summary when
  // this key is unset or the API call fails).
  const chainGptClient = new ChainGptClient(process.env.CHAINGPT_API_KEY);
  const explanationAgent = new ExplanationAgent(walletAgent, riskAgent, chainGptClient);
  const agentRouter = new AgentRouter(walletAgent, txAgent, riskAgent, evidenceEngine, alertAgent, explanationAgent, researchAgent, marketAgent);

  if (process.env.NODE_ENV === 'production' && !process.env.API_KEYS) {
    console.warn(
      'WARNING: running with NODE_ENV=production but API_KEYS is unset - the API is open to any caller. Set API_KEYS to require authentication.'
    );
  }

  if (!process.env.CHAINGPT_API_KEY) {
    console.warn('CHAINGPT_API_KEY is not set - /wallet/:address/explanation will use deterministic summaries only (no AI-generated prose).');
  }

  // Create and start API server
  const server = new APIServer(
    port,
    transactionRetriever,
    behaviorAnalyzer,
    intelligenceScorer,
    riskAssessor,
    priceProvider,
    dexRegistry,
    evidenceEngine,
    researchAgent,
    walletAgent,
    agentRouter,
    alertAgent,
    explanationAgent,
    liveAlertWatcher
  );

  server.start();
}

// Start application
main().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
