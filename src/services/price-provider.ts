/**
 * Price Provider Interface
 * Retrieves provider-reported token prices; does not imply signature verification.
 * CRITICAL: Never fabricates prices. Returns null when data unavailable.
 */

export interface PriceResult {
  mint: string;
  priceUSD: number | null; // null if price unavailable
  timestamp: number; // Provider publish time; requested time when unavailable.
  feedId?: string; // Provider identifier, not an on-chain account or slot proof.
  confidenceIntervalUSD?: number; // Uncertainty interval, not probability of profit.
  source: string; // e.g., "coingecko", "birdeye", "unknown"
  confidence: 'high' | 'medium' | 'low' | 'unknown';
}

/**
 * Price Provider Interface
 */
export interface PriceProvider {
  /**
   * Get price for a token at a specific time
   * @param mint Token mint address
   * @param timestamp Optional timestamp (defaults to now)
   * @returns PriceResult with null price if unavailable
   */
  getPrice(mint: string, timestamp?: number): Promise<PriceResult>;

  /**
   * Get prices for multiple tokens
   */
  getPrices(mints: string[], timestamp?: number): Promise<PriceResult[]>;

  /**
   * Health check
   */
  isHealthy(): Promise<boolean>;
}

/**
 * Stub Price Provider - returns null prices (real implementation uses CoinGecko/Birdeye)
 * This prevents any fabrication of prices in tests
 */
export class StubPriceProvider implements PriceProvider {
  async getPrice(mint: string, timestamp?: number): Promise<PriceResult> {
    return {
      mint,
      priceUSD: null,
      timestamp: timestamp ?? Math.floor(Date.now() / 1000),
      source: 'unknown',
      confidence: 'unknown',
    };
  }

  async getPrices(mints: string[], timestamp?: number): Promise<PriceResult[]> {
    return mints.map((mint) => ({
      mint,
      priceUSD: null,
      timestamp: timestamp ?? Math.floor(Date.now() / 1000),
      source: 'unknown',
      confidence: 'unknown',
    }));
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }
}
