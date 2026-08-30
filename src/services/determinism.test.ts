/**
 * Determinism check.
 *
 * This project's core claim is that scoring is deterministic: the same
 * input always produces the exact same output (see CLAUDE.md's "Scores
 * must stay explainable" invariant). This test proves that directly by
 * calling each pure scoring function twice with an identical, fixed
 * input and asserting the outputs are exactly equal - not "close",
 * exactly equal, field by field.
 *
 * Scope note: this runs both calls within the same test process (that's
 * what deep-equality on a pure function's output actually verifies -
 * same input in, same output out). It does not spawn two separate OS
 * processes; if that stronger guarantee is wanted later, run this same
 * file via `vitest run` twice in CI and diff a serialized snapshot.
 */
import { describe, it, expect } from 'vitest';
import { BehaviorAnalyzer } from './behavior-analyzer';
import { RiskAssessor } from './risk-assessor';
import { IntelligenceScorer } from './intelligence-scorer';
import { BehaviorMetrics, TransactionMeta, validateTransactionSignature } from '../types/domain';

const FIXED_BEHAVIOR: BehaviorMetrics = {
  transactionCount: 42,
  successTransactionCount: 38,
  failedTransactionCount: 4,
  failureRate: 4 / 42,
  swapCount: 12,
  uniqueTokens: 7,
  uniqueProgramsInteracted: 3,
  totalVolumeUSD: null,
  firstActiveSlot: 100_000,
  lastActiveSlot: 200_000,
  averageTransactionIntervalSeconds: 3_600,
  peakActivityHour: 14,
};

const FIXED_TRANSACTIONS: TransactionMeta[] = [
  {
    signature: validateTransactionSignature(
      '4MkLRHFdBJnPhKMVPy8gWXVwP8eA2CUyHhXmw3HzHrxP7a8H9LJ3JHcLhJPJ9Z2L3GJ6BL7Q5KJ9P2B3L6M5N8Z'
    ),
    slot: 100_000,
    blockTime: 1_700_000_000,
    status: 'success',
    fee: '5000',
    logMessages: [],
  },
  {
    signature: validateTransactionSignature(
      '5NkLRHFdBJnPhKMVPy8gWXVwP8eA2CUyHhXmw3HzHrxP7a8H9LJ3JHcLhJPJ9Z2L3GJ6BL7Q5KJ9P2B3L6M5N8Z'
    ),
    slot: 100_500,
    blockTime: 1_700_003_600,
    status: 'failed',
    fee: '5000',
    logMessages: [],
  },
];

describe('Determinism: RiskAssessor', () => {
  it('produces an exactly identical RiskScore for the same input, called twice', () => {
    const assessor = new RiskAssessor();
    const first = assessor.assessRisk(FIXED_BEHAVIOR);
    const second = assessor.assessRisk(FIXED_BEHAVIOR);

    expect(second).toEqual(first);
  });
});

describe('Determinism: IntelligenceScorer', () => {
  it('produces an exactly identical IntelligenceScore for the same input, called twice', () => {
    const scorer = new IntelligenceScorer();
    const first = scorer.scoreIntelligence(FIXED_BEHAVIOR);
    const second = scorer.scoreIntelligence(FIXED_BEHAVIOR);

    expect(second).toEqual(first);
  });
});

describe('Determinism: BehaviorAnalyzer', () => {
  it('produces exactly identical BehaviorMetrics for the same transaction list, called twice', () => {
    const analyzer = new BehaviorAnalyzer();
    const uniqueTokens = new Set<string>(['tokenA', 'tokenB']);
    const uniquePrograms = new Set<string>(['programA']);

    const first = analyzer.analyzeBehavior(FIXED_TRANSACTIONS, [], uniqueTokens, uniquePrograms);
    const second = analyzer.analyzeBehavior(FIXED_TRANSACTIONS, [], uniqueTokens, uniquePrograms);

    expect(second).toEqual(first);
  });
});

describe('Determinism: end-to-end pipeline', () => {
  it('produces identical risk + intelligence scores when chained from the same transactions, twice', () => {
    const analyzer = new BehaviorAnalyzer();
    const riskAssessor = new RiskAssessor();
    const scorer = new IntelligenceScorer();

    function runOnce(): { risk: ReturnType<RiskAssessor['assessRisk']>; intelligence: ReturnType<IntelligenceScorer['scoreIntelligence']> } {
      const behavior = analyzer.analyzeBehavior(FIXED_TRANSACTIONS, [], new Set(), new Set());
      return {
        risk: riskAssessor.assessRisk(behavior),
        intelligence: scorer.scoreIntelligence(behavior),
      };
    }

    const first = runOnce();
    const second = runOnce();

    expect(second).toEqual(first);
  });
});
