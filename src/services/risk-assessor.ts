/**
 * Risk Assessment Service
 * Calculates deterministic risk score from behavioral metrics
 * CRITICAL: Transparent risk factors. Never presents as financial advice.
 */

import { BehaviorMetrics, RiskScore, RiskFactors } from '../types/domain';

/**
 * Risk Assessor
 * Deterministic risk model based on observable blockchain patterns
 */
export class RiskAssessor {
  /**
   * Calculate risk score
   */
  assessRisk(behavior: BehaviorMetrics): RiskScore {
    const factors = this.calculateRiskFactors(behavior);

    // Weighted risk score
    const score =
      factors.failureRateScore * 0.3 +
      factors.frequencyScore * 0.1 +
      factors.concentrationScore * 0.2 +
      factors.volatilityScore * 0.2 +
      factors.suspiciousPatternScore * 0.2;

    const riskLevel = this.determineRiskLevel(score);

    const reasoning = this.generateReasoning(factors, behavior);

    return {
      score: Math.round(score),
      level: riskLevel,
      factors,
      reasoning,
    };
  }

  /**
   * Calculate individual risk factors
   */
  private calculateRiskFactors(behavior: BehaviorMetrics): RiskFactors {
    const failureRateScore = this.scoreFailureRate(behavior.failureRate);
    const frequencyScore = this.scoreFrequency(behavior.transactionCount);
    const concentrationScore = this.scoreConcentration(behavior.uniqueTokens, behavior.uniqueProgramsInteracted);
    const volatilityScore = this.scoreVolatility(behavior.uniqueTokens);
    const suspiciousPatternScore = this.scoreSuspiciousPatterns(behavior);

    return {
      failureRateScore,
      frequencyScore,
      concentrationScore,
      volatilityScore,
      suspiciousPatternScore,
    };
  }

  /**
   * Failure Rate Score (0-100, higher = riskier)
   */
  private scoreFailureRate(failureRate: number): number {
    if (failureRate > 0.5) {
      return 100; // More than 50% failure rate
    } else if (failureRate > 0.3) {
      return 80; // 30-50% failure rate
    } else if (failureRate > 0.1) {
      return 50; // 10-30% failure rate
    } else if (failureRate > 0.05) {
      return 25; // 5-10% failure rate
    } else {
      return 10; // < 5% failure rate (normal)
    }
  }

  /**
   * Frequency Score (0-100, higher = riskier)
   * Extreme frequency can indicate bot activity or spam
   */
  private scoreFrequency(transactionCount: number): number {
    if (transactionCount > 10000) {
      return 80; // Extremely high frequency
    } else if (transactionCount > 1000) {
      return 50; // High frequency
    } else if (transactionCount > 10) {
      return 20; // Normal frequency
    } else {
      return 5; // Low frequency
    }
  }

  /**
   * Concentration Score (0-100, higher = riskier)
   * High concentration = fewer tokens/programs = less diversified
   */
  private scoreConcentration(uniqueTokens: number, uniquePrograms: number): number {
    let score = 0;

    // Token concentration
    if (uniqueTokens <= 1) {
      score += 50; // Only 1 token
    } else if (uniqueTokens <= 3) {
      score += 30; // Few tokens
    } else if (uniqueTokens <= 10) {
      score += 10; // Moderate tokens
    }

    // Program concentration
    if (uniquePrograms <= 1) {
      score += 50; // Only 1 program
    } else if (uniquePrograms <= 3) {
      score += 30; // Few programs
    } else if (uniquePrograms <= 10) {
      score += 10; // Moderate programs
    }

    return Math.min(score, 100);
  }

  /**
   * Volatility Score (0-100, higher = riskier)
   * High token volatility (many different tokens) = unpredictable behavior
   */
  private scoreVolatility(uniqueTokens: number): number {
    if (uniqueTokens > 100) {
      return 90; // Extremely volatile
    } else if (uniqueTokens > 50) {
      return 70; // Very volatile
    } else if (uniqueTokens > 20) {
      return 50; // Volatile
    } else if (uniqueTokens > 5) {
      return 20; // Moderate
    } else {
      return 5; // Stable
    }
  }

  /**
   * Suspicious Patterns Score (0-100, higher = riskier)
   * Detects unusual behavioral patterns
   */
  private scoreSuspiciousPatterns(behavior: BehaviorMetrics): number {
    let score = 0;

    // Extreme failure rate
    if (behavior.failureRate > 0.5) {
      score += 40;
    }

    // Only failed transactions
    if (behavior.successTransactionCount === 0 && behavior.failedTransactionCount > 0) {
      score += 50;
    }

    // Peak activity at unusual hours (2-6 AM)
    if (behavior.peakActivityHour >= 2 && behavior.peakActivityHour <= 6) {
      score += 20; // Possible bot activity
    }

    // Very few swaps compared to total transactions
    if (behavior.transactionCount > 10 && behavior.swapCount === 0) {
      score += 20; // Mostly non-swap activity
    }

    return Math.min(score, 100);
  }

  /**
   * Determine risk level from score
   */
  private determineRiskLevel(score: number): 'low' | 'medium' | 'high' {
    if (score < 30) {
      return 'low';
    } else if (score < 70) {
      return 'medium';
    } else {
      return 'high';
    }
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(factors: RiskFactors, behavior: BehaviorMetrics): string[] {
    const reasoning: string[] = [];

    // Failure rate
    if (factors.failureRateScore > 50) {
      reasoning.push(`High transaction failure rate (${(behavior.failureRate * 100).toFixed(1)}%)`);
    }

    // Concentration
    if (factors.concentrationScore > 50) {
      if (behavior.uniqueTokens <= 1) {
        reasoning.push('Low token diversification (single token)');
      }
      if (behavior.uniqueProgramsInteracted <= 1) {
        reasoning.push('Low protocol diversification (single protocol)');
      }
    }

    // Volatility
    if (factors.volatilityScore > 50) {
      reasoning.push(`High token volatility (${behavior.uniqueTokens} unique tokens)`);
    }

    // Suspicious patterns
    if (factors.suspiciousPatternScore > 30) {
      if (behavior.successTransactionCount === 0 && behavior.failedTransactionCount > 0) {
        reasoning.push('All transactions failed');
      }
      if (behavior.peakActivityHour >= 2 && behavior.peakActivityHour <= 6) {
        reasoning.push('Unusual activity timing (possible automation)');
      }
    }

    // Frequency patterns
    if (factors.frequencyScore > 50) {
      reasoning.push(`Unusually high transaction frequency (${behavior.transactionCount} transactions)`);
    }

    return reasoning;
  }
}
