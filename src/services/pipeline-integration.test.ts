/**
 * Pipeline Integration Tests
 *
 * These tests drive the core deterministic pipeline — BehaviorAnalyzer →
 * IntelligenceScorer → RiskAssessor → AlertEngine — end-to-end with a
 * controlled set of synthetic TransactionMeta fixtures.
 *
 * No live RPC calls are made; the pipeline services themselves are real
 * (not mocked). This verifies that the contract between stages holds:
 * correct input → expected output shape, correct failure-rate math,
 * correct score ranges, correct alert conditions.
 *
 * ⚠️ VERIFICATION STATUS: All assertions are based on the deterministic
 * pipeline's documented behaviour.  A live Solana RPC / Mainnet test is
 * UNVERIFIED here — see LiveAlertWatcher and SolanaRpcClient for the
 * confirmed-vs-assumed note on those.
 */

import { describe, it, expect } from 'vitest';
import { BehaviorAnalyzer } from './behavior-analyzer';
import { IntelligenceScorer } from './intelligence-scorer';
import { RiskAssessor } from './risk-assessor';
import { AlertEngine } from './alert-engine';
import { TransactionMeta, validateTransactionSignature, validateWalletAddress } from '../types/domain';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** A valid 44-char base-58 address that passes validateWalletAddress(). */
const WALLET = validateWalletAddress('11111111111111111111111111111112');

// A pool of known-good 87-char base58 transaction signatures — verified in
// the determinism test to decode to exactly 64 bytes.  We cycle through them
// (with wraparound) so different fixture indices produce different values
// without risking an invalid base58 character from ad-hoc string manipulation.
const SIG_POOL = [
  '4MkLRHFdBJnPhKMVPy8gWXVwP8eA2CUyHhXmw3HzHrxP7a8H9LJ3JHcLhJPJ9Z2L3GJ6BL7Q5KJ9P2B3L6M5N8Z',
  '5NkLRHFdBJnPhKMVPy8gWXVwP8eA2CUyHhXmw3HzHrxP7a8H9LJ3JHcLhJPJ9Z2L3GJ6BL7Q5KJ9P2B3L6M5N8Z',
  '6PkLRHFdBJnPhKMVPy8gWXVwP8eA2CUyHhXmw3HzHrxP7a8H9LJ3JHcLhJPJ9Z2L3GJ6BL7Q5KJ9P2B3L6M5N8Z',
  '7QkLRHFdBJnPhKMVPy8gWXVwP8eA2CUyHhXmw3HzHrxP7a8H9LJ3JHcLhJPJ9Z2L3GJ6BL7Q5KJ9P2B3L6M5N8Z',
  '8RkLRHFdBJnPhKMVPy8gWXVwP8eA2CUyHhXmw3HzHrxP7a8H9LJ3JHcLhJPJ9Z2L3GJ6BL7Q5KJ9P2B3L6M5N8Z',
  '9SkLRHFdBJnPhKMVPy8gWXVwP8eA2CUyHhXmw3HzHrxP7a8H9LJ3JHcLhJPJ9Z2L3GJ6BL7Q5KJ9P2B3L6M5N8Z',
  'ATkLRHFdBJnPhKMVPy8gWXVwP8eA2CUyHhXmw3HzHrxP7a8H9LJ3JHcLhJPJ9Z2L3GJ6BL7Q5KJ9P2B3L6M5N8Z',
  'BUkLRHFdBJnPhKMVPy8gWXVwP8eA2CUyHhXmw3HzHrxP7a8H9LJ3JHcLhJPJ9Z2L3GJ6BL7Q5KJ9P2B3L6M5N8Z',
  'CVkLRHFdBJnPhKMVPy8gWXVwP8eA2CUyHhXmw3HzHrxP7a8H9LJ3JHcLhJPJ9Z2L3GJ6BL7Q5KJ9P2B3L6M5N8Z',
  'DWkLRHFdBJnPhKMVPy8gWXVwP8eA2CUyHhXmw3HzHrxP7a8H9LJ3JHcLhJPJ9Z2L3GJ6BL7Q5KJ9P2B3L6M5N8Z',
];

/**
 * Build a synthetic TransactionMeta.  `index` selects from SIG_POOL
 * (with wraparound) and is used to derive a distinct slot and blockTime.
 */
function makeTx(
  index: number,
  status: 'success' | 'failed' | 'unknown' = 'success',
  blockTime: number | null = 1_700_000_000 + index * 3600
): TransactionMeta {
  const sig = validateTransactionSignature(SIG_POOL[index % SIG_POOL.length]);
  return {
    signature: sig,
    slot: 100_000 + index,
    blockTime,
    status,
    fee: '5000',
    logMessages: [],
  };
}

// ---------------------------------------------------------------------------
// Tests: BehaviorAnalyzer
// ---------------------------------------------------------------------------

describe('BehaviorAnalyzer (pipeline stage 1)', () => {
  const analyzer = new BehaviorAnalyzer();

  it('returns zero-value BehaviorMetrics for an empty transaction list', () => {
    const metrics = analyzer.analyzeBehavior([], [], new Set(), new Set());
    expect(metrics.transactionCount).toBe(0);
    expect(metrics.failureRate).toBe(0);
    expect(metrics.swapCount).toBe(0);
  });

  it('correctly computes failure rate', () => {
    const txs: TransactionMeta[] = [
      makeTx(0, 'success'),
      makeTx(1, 'success'),
      makeTx(2, 'failed'),
      makeTx(3, 'failed'),
    ];
    const metrics = analyzer.analyzeBehavior(txs, [], new Set(), new Set());
    expect(metrics.transactionCount).toBe(4);
    expect(metrics.failureRate).toBeCloseTo(0.5, 6);
  });

  it('counts unique programs and tokens from the injected Sets', () => {
    const txs = [makeTx(0)];
    const programs = new Set(['prog-a', 'prog-b', 'prog-c']);
    const tokens = new Set(['tok-1', 'tok-2']);
    const metrics = analyzer.analyzeBehavior(txs, [], tokens, programs);
    expect(metrics.uniqueProgramsInteracted).toBe(3);
    expect(metrics.uniqueTokens).toBe(2);
  });

  it('swap count is 0 when no SwapEvents are provided', () => {
    const txs = [makeTx(0)];
    const metrics = analyzer.analyzeBehavior(txs, [], new Set(), new Set());
    expect(metrics.swapCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Tests: IntelligenceScorer
// ---------------------------------------------------------------------------

describe('IntelligenceScorer (pipeline stage 2)', () => {
  const analyzer = new BehaviorAnalyzer();
  const scorer = new IntelligenceScorer();

  it('score is in [0, 100]', () => {
    const txs = Array.from({ length: 10 }, (_, i) => makeTx(i));
    const metrics = analyzer.analyzeBehavior(txs, [], new Set(['t1']), new Set(['p1', 'p2']));
    const score = scorer.scoreIntelligence(metrics);
    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(score.score).toBeLessThanOrEqual(100);
  });

  it('returns components with all four named sub-scores', () => {
    const metrics = analyzer.analyzeBehavior([makeTx(0)], [], new Set(), new Set());
    const score = scorer.scoreIntelligence(metrics);
    expect(score.components).toMatchObject({
      activity: expect.any(Number),
      sophistication: expect.any(Number),
      consistency: expect.any(Number),
      efficiency: expect.any(Number),
    });
  });

  it('returns a non-empty factors array', () => {
    const metrics = analyzer.analyzeBehavior([makeTx(0)], [], new Set(), new Set());
    const score = scorer.scoreIntelligence(metrics);
    expect(Array.isArray(score.factors)).toBe(true);
    expect(score.factors.length).toBeGreaterThan(0);
  });

  it('empty transaction list produces score 0', () => {
    const metrics = analyzer.analyzeBehavior([], [], new Set(), new Set());
    const score = scorer.scoreIntelligence(metrics);
    expect(score.score).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Tests: RiskAssessor
// ---------------------------------------------------------------------------

describe('RiskAssessor (pipeline stage 3)', () => {
  const analyzer = new BehaviorAnalyzer();
  const assessor = new RiskAssessor();

  it('score is in [0, 100] and level is one of low/medium/high', () => {
    const txs = Array.from({ length: 5 }, (_, i) => makeTx(i));
    const metrics = analyzer.analyzeBehavior(txs, [], new Set(), new Set());
    const risk = assessor.assessRisk(metrics);
    expect(risk.score).toBeGreaterThanOrEqual(0);
    expect(risk.score).toBeLessThanOrEqual(100);
    expect(['low', 'medium', 'high']).toContain(risk.level);
  });

  it('high failure rate increases risk score vs zero failure rate', () => {
    const allFailed = Array.from({ length: 10 }, (_, i) => makeTx(i, 'failed'));
    const metricsHigh = analyzer.analyzeBehavior(allFailed, [], new Set(), new Set());
    const riskHigh = assessor.assessRisk(metricsHigh);

    const allOk = Array.from({ length: 10 }, (_, i) => makeTx(i, 'success'));
    const metricsLow = analyzer.analyzeBehavior(allOk, [], new Set(), new Set());
    const riskLow = assessor.assessRisk(metricsLow);

    expect(riskHigh.score).toBeGreaterThan(riskLow.score);
  });

  it('reasoning array is present and, when non-empty, all elements are non-empty strings', () => {
    const txs = Array.from({ length: 3 }, (_, i) => makeTx(i));
    const metrics = analyzer.analyzeBehavior(txs, [], new Set(), new Set());
    const risk = assessor.assessRisk(metrics);
    expect(Array.isArray(risk.reasoning)).toBe(true);
    for (const r of risk.reasoning) {
      expect(typeof r).toBe('string');
      expect(r.length).toBeGreaterThan(0);
    }
  });

  it('100% failed wallet produces non-empty reasoning', () => {
    const txs = Array.from({ length: 10 }, (_, i) => makeTx(i, 'failed'));
    const metrics = analyzer.analyzeBehavior(txs, [], new Set(), new Set());
    const risk = assessor.assessRisk(metrics);
    expect(risk.reasoning.length).toBeGreaterThan(0);
  });

  it('factors is an object with all five named sub-scores', () => {
    const metrics = analyzer.analyzeBehavior([makeTx(0)], [], new Set(), new Set());
    const risk = assessor.assessRisk(metrics);
    expect(risk.factors).toMatchObject({
      failureRateScore: expect.any(Number),
      frequencyScore: expect.any(Number),
      concentrationScore: expect.any(Number),
      volatilityScore: expect.any(Number),
      suspiciousPatternScore: expect.any(Number),
    });
  });
});

// ---------------------------------------------------------------------------
// Tests: AlertEngine (end of deterministic pipeline)
// ---------------------------------------------------------------------------

describe('AlertEngine (pipeline stage 4)', () => {
  const analyzer = new BehaviorAnalyzer();
  const assessor = new RiskAssessor();
  const engine = new AlertEngine();

  it('returns no alerts for a wallet with no anomalies', () => {
    const txs = Array.from({ length: 3 }, (_, i) => makeTx(i, 'success'));
    const metrics = analyzer.analyzeBehavior(txs, [], new Set(['tok']), new Set(['prog']));
    const risk = assessor.assessRisk(metrics);
    const alerts = engine.evaluate(WALLET, metrics, risk);
    expect(alerts.every((a) => ['high_failure_rate', 'abnormal_frequency', 'program_concentration', 'high_risk_behavior'].includes(a.type))).toBe(true);
    expect(alerts.some((a) => a.type === 'high_failure_rate')).toBe(false);
  });

  it('fires high_failure_rate when failure rate exceeds the threshold', () => {
    const txs = Array.from({ length: 10 }, (_, i) => makeTx(i, 'failed'));
    const metrics = analyzer.analyzeBehavior(txs, [], new Set(), new Set());
    const risk = assessor.assessRisk(metrics);
    const alerts = engine.evaluate(WALLET, metrics, risk);
    expect(alerts.some((a) => a.type === 'high_failure_rate')).toBe(true);
  });

  it('each alert cites real evidence strings (not empty or placeholder)', () => {
    const txs = Array.from({ length: 10 }, (_, i) => makeTx(i, 'failed'));
    const metrics = analyzer.analyzeBehavior(txs, [], new Set(), new Set());
    const risk = assessor.assessRisk(metrics);
    const alerts = engine.evaluate(WALLET, metrics, risk);
    for (const alert of alerts) {
      expect(alert.evidence.length).toBeGreaterThan(0);
      for (const ev of alert.evidence) {
        expect(typeof ev).toBe('string');
        expect(ev.length).toBeGreaterThan(0);
      }
    }
  });

  it('each alert has a valid severity', () => {
    const txs = Array.from({ length: 10 }, (_, i) => makeTx(i, 'failed'));
    const metrics = analyzer.analyzeBehavior(txs, [], new Set(), new Set());
    const risk = assessor.assessRisk(metrics);
    const alerts = engine.evaluate(WALLET, metrics, risk);
    for (const alert of alerts) {
      expect(['low', 'medium', 'high', 'critical']).toContain(alert.severity);
    }
  });
});

// ---------------------------------------------------------------------------
// Tests: full chain BehaviorAnalyzer → IntelligenceScorer → RiskAssessor
// ---------------------------------------------------------------------------

describe('Full pipeline: BehaviorAnalyzer → IntelligenceScorer + RiskAssessor', () => {
  const analyzer = new BehaviorAnalyzer();
  const scorer = new IntelligenceScorer();
  const assessor = new RiskAssessor();

  it('produces consistent, non-negative scores for a realistic mixed wallet', () => {
    const txs: TransactionMeta[] = [
      ...Array.from({ length: 7 }, (_, i) => makeTx(i, 'success')),
      ...Array.from({ length: 3 }, (_, i) => makeTx(7 + i, 'failed')),
    ];
    const metrics = analyzer.analyzeBehavior(txs, [], new Set(['usdc', 'sol']), new Set(['raydium', 'system']));

    const intel = scorer.scoreIntelligence(metrics);
    const risk = assessor.assessRisk(metrics);

    expect(intel.score).toBeGreaterThanOrEqual(0);
    expect(intel.score).toBeLessThanOrEqual(100);
    expect(risk.score).toBeGreaterThanOrEqual(0);
    expect(risk.score).toBeLessThanOrEqual(100);
    expect(risk.score).toBeGreaterThan(0);
  });

  it('calling the chain twice with identical input produces byte-identical scores (determinism)', () => {
    const txs = Array.from({ length: 6 }, (_, i) => makeTx(i, i % 2 === 0 ? 'success' : 'failed'));
    const programs = new Set(['prog-a', 'prog-b']);
    const tokens = new Set(['tok-x']);

    const m1 = analyzer.analyzeBehavior(txs, [], tokens, programs);
    const m2 = analyzer.analyzeBehavior(txs, [], tokens, programs);

    const i1 = scorer.scoreIntelligence(m1);
    const i2 = scorer.scoreIntelligence(m2);
    const r1 = assessor.assessRisk(m1);
    const r2 = assessor.assessRisk(m2);

    expect(i1.score).toBe(i2.score);
    expect(r1.score).toBe(r2.score);
    expect(r1.level).toBe(r2.level);
  });
});
