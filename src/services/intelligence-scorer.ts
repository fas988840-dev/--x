/**
 * Intelligence Scoring Service
 * Calculates deterministic intelligence score from behavioral metrics
 * CRITICAL: Every score must be explainable. Never claims unfounded sophistication.
 */

import { BehaviorMetrics, IntelligenceScore } from '../types/domain.js';

/**
 * Intelligence Scorer
 * Transparent, deterministic scoring based on observable blockchain data
 */
export class IntelligenceScorer {
  /**
   * Calculate intelligence score
   */
  scoreIntelligence(behavior: BehaviorMetrics): IntelligenceScore {
    const activityScore = this.scoreActivity(behavior);
    const sophisticationScore = this.scoreSophistication(behavior);
    const consistencyScore = this.scoreConsistency(behavior);
    const efficiencyScore = this.scoreEfficiency(behavior);

    // Weighted average of components
    const overallScore = (activityScore * 0.25 + sophisticationScore * 0.25 + consistencyScore * 0.25 + efficiencyScore * 0.25);

    const factors = this.generateFactors(behavior, {
      activityScore,
      sophisticationScore,
      consistencyScore,
      efficiencyScore,
    });

    return {
      score: Math.round(overallScore),
      components: {
        activity: Math.round(activityScore),
        sophistication: Math.round(sophisticationScore),
        consistency: Math.round(consistencyScore),
        efficiency: Math.round(efficiencyScore),
      },
      factors,
    };
  }

  /**
   * Activity Score (0-100)
   * Based on: transaction frequency, token diversity
   */
  private scoreActivity(behavior: BehaviorMetrics): number {
    let score = 0;

    // Transaction frequency (0-50 points)
    if (behavior.transactionCount > 1000) {
      score += 50;
    } else if (behavior.transactionCount > 100) {
      score += 40;
    } else if (behavior.transactionCount > 10) {
      score += 20;
    } else if (behavior.transactionCount > 0) {
      score += 10;
    }

    // Token diversity (0-50 points)
    if (behavior.uniqueTokens > 50) {
      score += 50;
    } else if (behavior.uniqueTokens > 20) {
      score += 40;
    } else if (behavior.uniqueTokens > 5) {
      score += 20;
    } else if (behavior.uniqueTokens > 1) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Sophistication Score (0-100)
   * Based on: number of programs used, program types
   */
  private scoreSophistication(behavior: BehaviorMetrics): number {
    let score = 0;

    // Program diversity (0-100 points)
    if (behavior.uniqueProgramsInteracted > 20) {
      score = 100;
    } else if (behavior.uniqueProgramsInteracted > 10) {
      score = 80;
    } else if (behavior.uniqueProgramsInteracted > 5) {
      score = 60;
    } else if (behavior.uniqueProgramsInteracted > 2) {
      score = 40;
    } else if (behavior.uniqueProgramsInteracted > 0) {
      score = 20;
    }

    return score;
  }

  /**
   * Consistency Score (0-100)
   * Based on: regular activity, pattern recognition
   */
  private scoreConsistency(behavior: BehaviorMetrics): number {
    let score = 50; // Baseline

    // Activity regularity (0-50 points)
    if (behavior.averageTransactionIntervalSeconds > 0 && behavior.averageTransactionIntervalSeconds < 86400) {
      // Regular activity (within a day)
      score += 50;
    } else if (behavior.averageTransactionIntervalSeconds === 0) {
      // No transactions or single transaction
      score = 0;
    }

    return Math.min(score, 100);
  }

  /**
   * Efficiency Score (0-100)
   * Based on: success rate, failed transactions
   */
  private scoreEfficiency(behavior: BehaviorMetrics): number {
    if (behavior.transactionCount === 0) {
      return 0;
    }

    const successRate = (behavior.successTransactionCount / behavior.transactionCount) * 100;

    if (successRate >= 95) {
      return 100;
    } else if (successRate >= 80) {
      return 80;
    } else if (successRate >= 60) {
      return 60;
    } else if (successRate >= 40) {
      return 40;
    } else {
      return 20;
    }
  }

  /**
   * Generate human-readable factors explaining the score
   */
  private generateFactors(
    behavior: BehaviorMetrics,
    // Not currently read in this function's body - factors below are
    // derived directly from `behavior`, not the pre-computed component
    // scores. Kept in the signature (matching the caller) and
    // underscore-prefixed rather than removed, since a future factor
    // (e.g. "sophistication driven mainly by X") would naturally want it.
    _components: {
      activityScore: number;
      sophisticationScore: number;
      consistencyScore: number;
      efficiencyScore: number;
    }
  ): string[] {
    const factors: string[] = [];

    // Activity factors
    if (behavior.transactionCount > 100) {
      factors.push(`High transaction frequency: ${behavior.transactionCount} transactions`);
    }
    if (behavior.uniqueTokens > 20) {
      factors.push(`High token diversity: interacted with ${behavior.uniqueTokens} tokens`);
    }

    // Sophistication factors
    if (behavior.uniqueProgramsInteracted > 10) {
      factors.push(`High program diversity: interacted with ${behavior.uniqueProgramsInteracted} protocols`);
    }

    // Efficiency factors
    if (behavior.failureRate > 0.2) {
      factors.push(`High failure rate: ${(behavior.failureRate * 100).toFixed(1)}% of transactions failed`);
    } else if (behavior.successTransactionCount > behavior.failedTransactionCount) {
      factors.push(`Efficient execution: ${((behavior.successTransactionCount / behavior.transactionCount) * 100).toFixed(1)}% success rate`);
    }

    return factors;
  }
}
