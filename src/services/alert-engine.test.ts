import { describe, it, expect } from 'vitest';
import { AlertEngine } from './alert-engine';
import { BehaviorMetrics, RiskScore, validateWalletAddress } from '../types/domain';

const ADDRESS = validateWalletAddress('11111111111111111111111111111112');

const BASE_BEHAVIOR: BehaviorMetrics = {
  transactionCount: 20,
  successTransactionCount: 18,
  failedTransactionCount: 2,
  failureRate: 0.1,
  swapCount: 0,
  uniqueTokens: 5,
  uniqueProgramsInteracted: 5,
  totalVolumeUSD: null,
  firstActiveSlot: 100,
  lastActiveSlot: 200,
  averageTransactionIntervalSeconds: 3600,
  peakActivityHour: 12,
};

const BASE_RISK: RiskScore = {
  score: 20,
  level: 'low',
  factors: {
    failureRateScore: 10,
    frequencyScore: 5,
    concentrationScore: 10,
    volatilityScore: 5,
    suspiciousPatternScore: 0,
  },
  reasoning: [],
};

describe('AlertEngine', () => {
  it('triggers no alerts for unremarkable behavior', () => {
    const engine = new AlertEngine();
    expect(engine.evaluate(ADDRESS, BASE_BEHAVIOR, BASE_RISK)).toEqual([]);
  });

  it('triggers high_failure_rate with real evidence when failure rate exceeds the threshold', () => {
    const engine = new AlertEngine();
    const behavior: BehaviorMetrics = { ...BASE_BEHAVIOR, failureRate: 0.4, failedTransactionCount: 8, transactionCount: 20 };

    const alerts = engine.evaluate(ADDRESS, behavior, BASE_RISK);

    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('high_failure_rate');
    expect(alerts[0].severity).toBe('medium');
    expect(alerts[0].evidence).toContain('failedTransactionCount=8');
    expect(alerts[0].walletAddress).toBe(ADDRESS);
  });

  it('escalates high_failure_rate to severity high above the critical threshold', () => {
    const engine = new AlertEngine();
    const behavior: BehaviorMetrics = { ...BASE_BEHAVIOR, failureRate: 0.6, failedTransactionCount: 12 };

    const alerts = engine.evaluate(ADDRESS, behavior, BASE_RISK);
    expect(alerts[0].severity).toBe('high');
  });

  it('triggers program_concentration only above the minimum transaction count', () => {
    const engine = new AlertEngine();
    const belowMin: BehaviorMetrics = { ...BASE_BEHAVIOR, transactionCount: 5, uniqueProgramsInteracted: 1 };
    const aboveMin: BehaviorMetrics = { ...BASE_BEHAVIOR, transactionCount: 15, uniqueProgramsInteracted: 1 };

    expect(engine.evaluate(ADDRESS, belowMin, BASE_RISK)).toEqual([]);
    expect(engine.evaluate(ADDRESS, aboveMin, BASE_RISK)[0].type).toBe('program_concentration');
  });

  it('triggers high_risk_behavior and cites the real risk reasoning as evidence', () => {
    const engine = new AlertEngine();
    const risk: RiskScore = { ...BASE_RISK, level: 'high', score: 85, reasoning: ['All transactions failed'] };

    const alerts = engine.evaluate(ADDRESS, BASE_BEHAVIOR, risk);

    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('high_risk_behavior');
    expect(alerts[0].evidence).toEqual(['All transactions failed']);
  });

  it('never invents unusual_volume/large_swap/new_token_interaction alerts (no real volume data exists yet)', () => {
    const engine = new AlertEngine();
    const alerts = engine.evaluate(ADDRESS, BASE_BEHAVIOR, BASE_RISK);
    const types = alerts.map((a) => a.type);

    expect(types).not.toContain('unusual_volume');
    expect(types).not.toContain('large_swap');
    expect(types).not.toContain('new_token_interaction');
  });

  it('can return multiple alerts at once, each independently evidenced', () => {
    const engine = new AlertEngine();
    const behavior: BehaviorMetrics = { ...BASE_BEHAVIOR, failureRate: 0.6, failedTransactionCount: 12, uniqueProgramsInteracted: 1, transactionCount: 20 };
    const risk: RiskScore = { ...BASE_RISK, level: 'high' };

    const alerts = engine.evaluate(ADDRESS, behavior, risk);
    const types = alerts.map((a) => a.type).sort();

    expect(types).toEqual(['high_failure_rate', 'high_risk_behavior', 'program_concentration'].sort());
  });
});
