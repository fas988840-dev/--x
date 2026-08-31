import { describe, it, expect, beforeEach } from 'vitest';
import { BehaviorAnalyzer } from '../services/behavior-analyzer';
import { IntelligenceScorer } from '../services/intelligence-scorer';
import { RiskAssessor } from '../services/risk-assessor';
import { TransactionMeta, validateTransactionSignature, BehaviorMetrics } from '../types/domain';

describe('BehaviorAnalyzer', () => {
  let analyzer: BehaviorAnalyzer;

  beforeEach(() => {
    analyzer = new BehaviorAnalyzer();
  });

  it('should handle empty transactions', () => {
    const behavior = analyzer.analyzeBehavior([], [], new Set(), new Set());
    expect(behavior.transactionCount).toBe(0);
    expect(behavior.totalVolumeUSD).toBeNull();
  });

  it('should calculate failure rate correctly', () => {
    const transactions: TransactionMeta[] = [
      {
        signature: validateTransactionSignature(
          '4MkLRHFdBJnPhKMVPy8gWXVwP8eA2CUyHhXmw3HzHrxP7a8H9LJ3JHcLhJPJ9Z2L3GJ6BL7Q5KJ9P2B3L6M5N8Z'
        ),
        slot: 100,
        blockTime: null,
        status: 'success',
        fee: '5000',
        logMessages: [],
      },
      {
        signature: validateTransactionSignature(
          '4MkLRHFdBJnPhKMVPy8gWXVwP8eA2CUyHhXmw3HzHrxP7a8H9LJ3JHcLhJPJ9Z2L3GJ6BL7Q5KJ9P2B3L6M5N8A'
        ),
        slot: 101,
        blockTime: null,
        status: 'failed',
        fee: '5000',
        logMessages: [],
      },
    ];

    const behavior = analyzer.analyzeBehavior(transactions, [], new Set(), new Set());

    expect(behavior.failureRate).toBe(0.5);
    expect(behavior.successTransactionCount).toBe(1);
    expect(behavior.failedTransactionCount).toBe(1);
  });

  it('should count unique tokens and programs correctly', () => {
    const transactions: TransactionMeta[] = [
      {
        signature: validateTransactionSignature(
          '4MkLRHFdBJnPhKMVPy8gWXVwP8eA2CUyHhXmw3HzHrxP7a8H9LJ3JHcLhJPJ9Z2L3GJ6BL7Q5KJ9P2B3L6M5N8Z'
        ),
        slot: 100,
        blockTime: null,
        status: 'success',
        fee: '5000',
        logMessages: [],
      },
    ];

    const uniqueTokens = new Set(['EPjFWaLb3odccccfFFd82hhSSUmUjKP6MtoxQTxxuQ', 'So11111111111111111111111111111111111111112']);
    const uniquePrograms = new Set(['JUP6LkbZbjhSnLvsTQrJ1A8jo9KbwnQXfJwW8SmrCH4']);

    const behavior = analyzer.analyzeBehavior(transactions, [], uniqueTokens, uniquePrograms);

    expect(behavior.uniqueTokens).toBe(2);
    expect(behavior.uniqueProgramsInteracted).toBe(1);
  });
});

describe('IntelligenceScorer', () => {
  let scorer: IntelligenceScorer;

  beforeEach(() => {
    scorer = new IntelligenceScorer();
  });

  it('should score high activity correctly', () => {
    const behavior: BehaviorMetrics = {
      transactionCount: 500,
      successTransactionCount: 450,
      failedTransactionCount: 50,
      failureRate: 0.1,
      swapCount: 100,
      uniqueTokens: 30,
      uniqueProgramsInteracted: 15,
      totalVolumeUSD: 50000,
      firstActiveSlot: 100,
      lastActiveSlot: 1000,
      averageTransactionIntervalSeconds: 100,
      peakActivityHour: 12,
    };

    const score = scorer.scoreIntelligence(behavior);

    expect(score.score).toBeGreaterThan(50);
    expect(score.components.activity).toBeGreaterThan(40);
    expect(score.factors.length).toBeGreaterThan(0);
  });

  it('should give low score to inactive wallet', () => {
    const behavior: BehaviorMetrics = {
      transactionCount: 1,
      successTransactionCount: 1,
      failedTransactionCount: 0,
      failureRate: 0,
      swapCount: 0,
      uniqueTokens: 1,
      uniqueProgramsInteracted: 1,
      totalVolumeUSD: null,
      firstActiveSlot: 100,
      lastActiveSlot: 100,
      averageTransactionIntervalSeconds: 0,
      peakActivityHour: 12,
    };

    const score = scorer.scoreIntelligence(behavior);

    expect(score.score).toBeLessThan(35);
  });

  it('should score efficiency component correctly', () => {
    const behavior: BehaviorMetrics = {
      transactionCount: 100,
      successTransactionCount: 95,
      failedTransactionCount: 5,
      failureRate: 0.05,
      swapCount: 20,
      uniqueTokens: 10,
      uniqueProgramsInteracted: 5,
      totalVolumeUSD: 10000,
      firstActiveSlot: 100,
      lastActiveSlot: 1000,
      averageTransactionIntervalSeconds: 100,
      peakActivityHour: 12,
    };

    const score = scorer.scoreIntelligence(behavior);

    expect(score.components.efficiency).toBe(100); // 95% success rate
  });
});

describe('RiskAssessor', () => {
  let assessor: RiskAssessor;

  beforeEach(() => {
    assessor = new RiskAssessor();
  });

  it('should assess low risk for healthy wallet', () => {
    const behavior: BehaviorMetrics = {
      transactionCount: 100,
      successTransactionCount: 95,
      failedTransactionCount: 5,
      failureRate: 0.05,
      swapCount: 50,
      uniqueTokens: 20,
      uniqueProgramsInteracted: 10,
      totalVolumeUSD: 50000,
      firstActiveSlot: 100,
      lastActiveSlot: 5000,
      averageTransactionIntervalSeconds: 100,
      peakActivityHour: 12,
    };

    const risk = assessor.assessRisk(behavior);

    expect(risk.level).toBe('low');
    expect(risk.score).toBeLessThan(30);
  });

  it('should assess high risk for high failure rate', () => {
    const behavior: BehaviorMetrics = {
      transactionCount: 100,
      successTransactionCount: 10,
      failedTransactionCount: 90,
      failureRate: 0.9,
      swapCount: 0,
      uniqueTokens: 1,
      uniqueProgramsInteracted: 1,
      totalVolumeUSD: null,
      firstActiveSlot: 100,
      lastActiveSlot: 200,
      averageTransactionIntervalSeconds: 50,
      peakActivityHour: 12,
    };

    const risk = assessor.assessRisk(behavior);

    expect(risk.level).toBe('medium');
    expect(risk.score).toBeGreaterThan(60);
    expect(risk.reasoning.some((r) => r.includes('failure'))).toBe(true);
  });

  it('should assess high risk for concentration', () => {
    const behavior: BehaviorMetrics = {
      transactionCount: 50,
      successTransactionCount: 45,
      failedTransactionCount: 5,
      failureRate: 0.1,
      swapCount: 20,
      uniqueTokens: 1, // Only 1 token
      uniqueProgramsInteracted: 1, // Only 1 program
      totalVolumeUSD: 5000,
      firstActiveSlot: 100,
      lastActiveSlot: 500,
      averageTransactionIntervalSeconds: 100,
      peakActivityHour: 12,
    };

    const risk = assessor.assessRisk(behavior);

    expect(risk.score).toBeGreaterThan(28); // Concentration increases risk
    expect(risk.factors.concentrationScore).toBeGreaterThan(50);
  });

  it('should detect suspicious patterns', () => {
    const behavior: BehaviorMetrics = {
      transactionCount: 100,
      successTransactionCount: 0,
      failedTransactionCount: 100,
      failureRate: 1,
      swapCount: 0,
      uniqueTokens: 5,
      uniqueProgramsInteracted: 3,
      totalVolumeUSD: null,
      firstActiveSlot: 100,
      lastActiveSlot: 200,
      averageTransactionIntervalSeconds: 50,
      peakActivityHour: 3, // 3 AM (suspicious)
    };

    const risk = assessor.assessRisk(behavior);

    expect(risk.factors.suspiciousPatternScore).toBeGreaterThan(50);
    expect(risk.reasoning.some((r) => r.includes('failed'))).toBe(true);
  });
});
