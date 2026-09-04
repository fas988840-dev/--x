/**
 * Main application entry point
 * Sets up and starts the API server
 */

import { SolanaConfig } from './types/config.js';
import { SolanaRpcClient } from './services/solana-rpc-client.js';
import { TransactionRetriever } from './services/transaction-retriever.js';
import { BehaviorAnalyzer } from './services/behavior-analyzer.js';
import { IntelligenceScorer } from './services/intelligence-scorer.js';
import { RiskAssessor } from './services/risk-assessor.js';
import { PriceProvider, StubPriceProvider } from './services/price-provider.js';
import { CoinGeckoPriceProvider } from './services/coingecko-price-provider.js';
import { PythHermesPriceProvider, parsePythFeedMap } from './services/pyth-hermes-price-provider.js';
import { createDefaultDexRegistry } from './services/dex-registry.js';
import { InstructionParser } from './services/instruction-parser.js';
import { APIServer } from './api/server.js';
import { WalletIntelligenceAgent, TransactionIntelligenceAgent, RiskAgent, ResearchAgent, MarketEventAgent, AlertAgent, ExplanationAgent } from './agents/core_agents.js';
import { EvidenceEngine } from './agents/evidence-engine.js';
import { AlertEngine } from './services/alert-engine.js';
import { LiveAlertWatcher } from './services/live-alert-watcher.js';
import { TokenSecurityVerifier } from './services/token-security-verifier.js';
import { ChainGptClient } from './services/chaingpt-client.js';
import { AgentRouter } from './agents/agent-router.js';
import { logger } from './utils/logger.js';

function createPriceProvider(): PriceProvider {
  switch (process.env.PRICE_PROVIDER) {
    case 'stub':
      return new StubPriceProvider();
    case 'pyth':
      return new PythHermesPriceProvider({
        apiKey: process.env.PYTH_API_KEY,
        feedMap: parsePythFeedMap(process.env.PYTH_FEED_MAP_JSON),
      });
    default:
      return new CoinGeckoPriceProvider();
  }
}

/**
 * Initialize and start the application
 */
async function main(): Promise<void> {
  const port = parseInt(process.env.PORT || '3000', 10);
  const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

  logger.info('Initializing FactLedger...');
  logger.info(`RPC URL: ${rpcUrl}`);
  logger.info(`Port: ${port}`);

  const solanaConfig: SolanaConfig = {
    rpcUrl,
    commitment: 'confirmed',
    maxRetries: 3,
    retryDelayMs: 1000,
  };

  const rpcClient = new SolanaRpcClient(solanaConfig);
  const transactionRetriever = new TransactionRetriever(rpcClient);
  const dexRegistry = createDefaultDexRegistry();
  const instructionParser = new InstructionParser(dexRegistry);
  const behaviorAnalyzer = new BehaviorAnalyzer();
  const intelligenceScorer = new IntelligenceScorer();
  const riskAssessor = new RiskAssessor();
  const priceProvider = createPriceProvider();

  if (process.env.PRICE_PROVIDER === 'pyth' && !process.env.PYTH_API_KEY) {
    logger.warn('PRICE_PROVIDER=pyth but PYTH_API_KEY is unset - Pyth prices will return UNKNOWN until the key is configured.');
  }

  if (process.env.PRICE_PROVIDER === 'pyth' && Object.keys(parsePythFeedMap(process.env.PYTH_FEED_MAP_JSON)).length === 0) {
    logger.warn('PRICE_PROVIDER=pyth but PYTH_FEED_MAP_JSON has no valid mint-to-feed mappings - Pyth prices will return UNKNOWN for unmapped mints.');
  }

  const txAgent = new TransactionIntelligenceAgent(transactionRetriever, rpcClient, instructionParser);
  const walletAgent = new WalletIntelligenceAgent(transactionRetriever, rpcClient, txAgent);
  const riskAgent = new RiskAgent(transactionRetriever, behaviorAnalyzer, riskAssessor);
  const researchAgent = new ResearchAgent(walletAgent, riskAgent);
  const evidenceEngine = new EvidenceEngine(transactionRetriever, txAgent);
  const marketAgent = new MarketEventAgent();
  const alertEngine = new AlertEngine();
  const alertAgent = new AlertAgent(transactionRetriever, behaviorAnalyzer, riskAssessor, alertEngine);
  const liveAlertWatcher = new LiveAlertWatcher(rpcClient, transactionRetriever, behaviorAnalyzer, riskAssessor, alertEngine);
  const tokenSecurityVerifier = new TokenSecurityVerifier(rpcClient);
  const chainGptClient = new ChainGptClient(process.env.CHAINGPT_API_KEY);
  const explanationAgent = new ExplanationAgent(walletAgent, riskAgent, chainGptClient);
  const agentRouter = new AgentRouter(walletAgent, txAgent, riskAgent, evidenceEngine, alertAgent, explanationAgent, researchAgent, marketAgent);

  if (process.env.NODE_ENV === 'production' && !process.env.API_KEYS) {
    logger.warn(
      'WARNING: running with NODE_ENV=production but API_KEYS is unset - the API is open to any caller. Set API_KEYS to require authentication.'
    );
  }

  if (!process.env.CHAINGPT_API_KEY) {
    logger.warn('CHAINGPT_API_KEY is not set - /wallet/:address/explanation will use deterministic summaries only (no AI-generated prose).');
  }

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
    liveAlertWatcher,
    tokenSecurityVerifier
  );

  server.start();
}

main().catch((error) => {
  logger.error('Failed to start application:', error);
  process.exit(1);
});
