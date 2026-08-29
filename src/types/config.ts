/**
 * Configuration types
 */

export interface SolanaConfig {
  rpcUrl: string;
  commitment: 'confirmed' | 'finalized' | 'processed';
  maxRetries: number;
  retryDelayMs: number;
}

export interface PriceProviderConfig {
  coingeckoApiUrl: string;
  cacheDurationSeconds: number;
  timeoutMs: number;
}

export interface DexRegistryConfig {
  programIds: Record<string, string>; // dex name -> program ID
}

export interface AppConfig {
  port: number;
  environment: 'development' | 'production' | 'test';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  solana: SolanaConfig;
  priceProvider: PriceProviderConfig;
  dexRegistry: DexRegistryConfig;
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}
