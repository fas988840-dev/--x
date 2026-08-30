/**
 * Main application entry point
 * Sets up and starts the API server
 */

import { SolanaConfig, PriceProviderConfig, DexRegistryConfig } from '../types/config';
import { SolanaRpcClient } from '../services/solana-rpc-client';
import { TransactionRetriever } from '../services/transaction-retriever';
import { BehaviorAnalyzer } from '../services/behavior-analyzer';
import { IntelligenceScorer } from '../services/intelligence-scorer';
import { RiskAssessor } from '../services/risk-assessor';
import { StubPriceProvider } from '../services/price-provider';
import { APIServer } from '../api/server';

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
  const behaviorAnalyzer = new BehaviorAnalyzer();
  const intelligenceScorer = new IntelligenceScorer();
  const riskAssessor = new RiskAssessor();
  const priceProvider = new StubPriceProvider();

  // Create and start API server
  const server = new APIServer(
    port,
    transactionRetriever,
    behaviorAnalyzer,
    intelligenceScorer,
    riskAssessor,
    priceProvider
  );

  server.start();
}

// Start application
main().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
