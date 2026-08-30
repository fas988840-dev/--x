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
import { DexRegistry } from './services/dex-registry';
import { InstructionParser } from './services/instruction-parser';
import { APIServer } from './api/server';
import { WalletIntelligenceAgent, TransactionIntelligenceAgent, RiskAgent, ResearchAgent, MarketEventAgent } from './agents/core_agents';
import { EvidenceEngine } from './agents/evidence-engine';
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
  const dexRegistry = new DexRegistry(); // no adapters registered - see CLAUDE.md
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
  const walletAgent = new WalletIntelligenceAgent(transactionRetriever, rpcClient);
  const txAgent = new TransactionIntelligenceAgent(transactionRetriever, rpcClient, instructionParser);
  const riskAgent = new RiskAgent(transactionRetriever, behaviorAnalyzer, riskAssessor);
  const researchAgent = new ResearchAgent(walletAgent, riskAgent);
  const evidenceEngine = new EvidenceEngine(transactionRetriever, txAgent);
  const marketAgent = new MarketEventAgent();
  const agentRouter = new AgentRouter(walletAgent, txAgent, riskAgent, evidenceEngine, researchAgent, marketAgent);

  if (process.env.NODE_ENV === 'production' && !process.env.API_KEYS) {
    console.warn(
      'WARNING: running with NODE_ENV=production but API_KEYS is unset - the API is open to any caller. Set API_KEYS to require authentication.'
    );
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
    agentRouter
  );

  server.start();
}

// Start application
main().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
