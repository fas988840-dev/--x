import { describe, expect, it } from 'vitest';
import { InMemoryEvidenceGraphStore } from './evidence-graph.js';

describe('InMemoryEvidenceGraphStore', () => {
  it('stores deterministic append-only observations and deduplicates identical input', () => {
    const store = new InMemoryEvidenceGraphStore();
    const input = {
      entity: { type: 'wallet' as const, id: 'wallet-1' },
      related: [{ type: 'transaction' as const, id: 'tx-1' }],
      observedAt: 100,
      source: { kind: 'solana_rpc' as const, reference: 'slot:123' },
      claim: 'Wallet participated in transaction',
      confidence: 'confirmed' as const,
      rulesetVersion: 'evidence_v1',
      metadata: { b: 2, a: 1 },
    };

    const first = store.append(input);
    const second = store.append({ ...input, metadata: { a: 1, b: 2 } });

    expect(second.id).toBe(first.id);
    expect(store.stats().observations).toBe(1);
    expect(store.findByEntity({ type: 'transaction', id: 'tx-1' })).toHaveLength(1);
  });

  it('preserves confirmed, candidate and unknown confidence instead of inventing certainty', () => {
    const store = new InMemoryEvidenceGraphStore();

    for (const [index, confidence] of ['confirmed', 'candidate', 'unknown'].entries()) {
      store.append({
        entity: { type: 'wallet', id: `wallet-${index}` },
        observedAt: index,
        source: { kind: 'derived' },
        claim: `claim-${index}`,
        confidence: confidence as 'confirmed' | 'candidate' | 'unknown',
        rulesetVersion: 'evidence_v1',
      });
    }

    expect(store.stats()).toEqual({
      observations: 3,
      uniqueEntities: 3,
      confirmed: 1,
      candidate: 1,
      unknown: 1,
    });
  });

  it('returns a chronological risk timeline for an entity', () => {
    const store = new InMemoryEvidenceGraphStore();
    const wallet = { type: 'wallet' as const, id: 'wallet-risk' };

    store.append({
      entity: { type: 'risk_event', id: 'risk-later' },
      related: [wallet],
      observedAt: 200,
      source: { kind: 'derived' },
      claim: 'Risk score changed',
      confidence: 'confirmed',
      rulesetVersion: 'risk_v1',
      riskScore: 72,
    });
    store.append({
      entity: { type: 'risk_event', id: 'risk-earlier' },
      related: [wallet],
      observedAt: 100,
      source: { kind: 'derived' },
      claim: 'Initial risk score',
      confidence: 'confirmed',
      rulesetVersion: 'risk_v1',
      riskScore: 41,
    });

    expect(store.getRiskTimeline(wallet).map((item) => item.riskScore)).toEqual([41, 72]);
  });

  it('rejects invalid timestamps, expiry windows and risk scores', () => {
    const store = new InMemoryEvidenceGraphStore();
    const base = {
      entity: { type: 'wallet' as const, id: 'wallet-1' },
      observedAt: 10,
      source: { kind: 'derived' as const },
      claim: 'claim',
      confidence: 'confirmed' as const,
      rulesetVersion: 'v1',
    };

    expect(() => store.append({ ...base, observedAt: -1 })).toThrow();
    expect(() => store.append({ ...base, expiresAt: 9 })).toThrow();
    expect(() => store.append({ ...base, riskScore: 101 })).toThrow();
  });

  it('returns defensive copies so callers cannot mutate stored evidence', () => {
    const store = new InMemoryEvidenceGraphStore();
    const saved = store.append({
      entity: { type: 'wallet', id: 'wallet-1' },
      observedAt: 1,
      source: { kind: 'derived' },
      claim: 'original',
      confidence: 'confirmed',
      rulesetVersion: 'v1',
      metadata: { sourceCount: 1 },
    });

    saved.metadata.sourceCount = 999;
    const reread = store.get(saved.id);

    expect(reread?.metadata.sourceCount).toBe(1);
  });
});
