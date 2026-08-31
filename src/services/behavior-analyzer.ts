/**
 * Behavior Analysis Service
 * Calculates deterministic behavioral metrics from blockchain data
 * CRITICAL: Never fabricates data. Only uses verified blockchain facts.
 */

import { TransactionMeta, BehaviorMetrics, SwapEvent } from '../types/domain';

/**
 * Behavior Analysis Service
 */
export class BehaviorAnalyzer {
  /**
   * Calculate behavior metrics from transactions
   */
  analyzeBehavior(
    transactions: TransactionMeta[],
    swaps: SwapEvent[],
    uniqueTokens: Set<string>,
    uniquePrograms: Set<string>
  ): BehaviorMetrics {
    if (transactions.length === 0) {
      return this.emptyBehavior();
    }

    // Count successful and failed transactions
    const successCount = transactions.filter((tx) => tx.status === 'success').length;
    const failureCount = transactions.filter((tx) => tx.status === 'failed').length;
    const failureRate = transactions.length > 0 ? failureCount / transactions.length : 0;

    // Calculate activity timing
    const slots = transactions.map((tx) => tx.slot).filter((s) => s > 0);
    const firstSlot = slots.length > 0 ? Math.min(...slots) : 0;
    const lastSlot = slots.length > 0 ? Math.max(...slots) : 0;

    // Calculate average transaction interval
    let avgIntervalSeconds = 0;
    if (transactions.length > 1 && transactions[0].blockTime && transactions[transactions.length - 1].blockTime) {
      const timeDiff = Math.abs(
        (transactions[transactions.length - 1].blockTime || 0) - (transactions[0].blockTime || 0)
      );
      avgIntervalSeconds = timeDiff / (transactions.length - 1);
    }

    // Peak activity hour (from blockTime)
    const peakHour = this.calculatePeakActivityHour(transactions);

    // Volume calculation - will be null if prices unavailable
    const totalVolumeUSD = this.calculateVolume(swaps);

    return {
      transactionCount: transactions.length,
      successTransactionCount: successCount,
      failedTransactionCount: failureCount,
      failureRate,
      swapCount: swaps.length,
      uniqueTokens: uniqueTokens.size,
      uniqueProgramsInteracted: uniquePrograms.size,
      totalVolumeUSD,
      firstActiveSlot: firstSlot,
      lastActiveSlot: lastSlot,
      averageTransactionIntervalSeconds: avgIntervalSeconds,
      peakActivityHour: peakHour,
    };
  }

  /**
   * Calculate peak activity hour (0-23)
   */
  private calculatePeakActivityHour(transactions: TransactionMeta[]): number {
    const hourCounts = new Array(24).fill(0);

    for (const tx of transactions) {
      if (tx.blockTime) {
        const date = new Date(tx.blockTime * 1000);
        const hour = date.getUTCHours();
        hourCounts[hour]++;
      }
    }

    let maxHour = 0;
    let maxCount = 0;
    for (let i = 0; i < 24; i++) {
      if (hourCounts[i] > maxCount) {
        maxCount = hourCounts[i];
        maxHour = i;
      }
    }

    return maxHour;
  }

  /**
   * Calculate total volume in USD
   * Returns null if any required prices are unavailable
   */
  private calculateVolume(swaps: SwapEvent[]): number | null {
    let totalVolume = 0;
    let hasAllPrices = true;

    for (const swap of swaps) {
      if (swap.inputUSD !== null && swap.outputUSD !== null) {
        // Use average of input/output for swap volume
        totalVolume += (swap.inputUSD + swap.outputUSD) / 2;
      } else {
        // Price unavailable - cannot calculate exact volume
        hasAllPrices = false;
      }
    }

    return hasAllPrices && totalVolume > 0 ? totalVolume : null;
  }

  /**
   * Empty behavior metrics (no transactions)
   */
  private emptyBehavior(): BehaviorMetrics {
    return {
      transactionCount: 0,
      successTransactionCount: 0,
      failedTransactionCount: 0,
      failureRate: 0,
      swapCount: 0,
      uniqueTokens: 0,
      uniqueProgramsInteracted: 0,
      totalVolumeUSD: null,
      firstActiveSlot: 0,
      lastActiveSlot: 0,
      averageTransactionIntervalSeconds: 0,
      peakActivityHour: 0,
    };
  }
}
