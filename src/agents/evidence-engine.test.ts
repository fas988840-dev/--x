import { describe, it, expect, vi } from 'vitest';
import { EvidenceEngine } from './evidence-engine';
import { EvidenceStatus, TransactionIntelligenceAgent } from './core_agents';
import { TransactionRetriever } from '../services/transaction-retriever';
import { TransactionMeta, validateTransactionSignature } from '../types/domain';

const VALID_ADDRESS = '11111111111111111111111111111112';
const SIG_A = '4MkLRHFdBJnPhKMVPy8gWXVwP8eA2CUyHhXmw3HzHrxP7a8H9LJ3JHcLhJPJ9Z2L3GJ6BL7Q5KJ9P2B3L6M5N8Z';
const SIG_B = '5NkLRHFdBJnPhKMVPy8gWXVwP8eA2CUyHhXmw3HzHrxP7a8H9LJ3JHcLhJPJ9Z2L3GJ6BL7Q5KJ9P2B3L6M5N8Z';

function meta(signature: string, slot: number): TransactionMeta {
  return {
    signature: validateTransactionSignature(signature),
    slot,
    blockTime: null,
    status: 'success',
    fee: '5000',
    logMessages: [],
  };
}

describe('EvidenceEngine', () => {
  it('extracts a confidence-scored evidence entry per real instruction, using the fixed status->percent mapping', async () => {
    const transactionRetriever = {
      getWalletTransactionsMeta: vi.fn().mockResolvedValue([meta(SIG_A, 100), meta(SIG_B, 200)]),
    } as unknown as TransactionRetriever;

    const txAgent = {
      parseTx: vi.fn(async (sig: string) => ({
        agentId: 'tx_intel_v1',
        timestamp: Date.now(),
        evidenceStatus: EvidenceStatus.VERIFIED,
        confidenceScore: 1,
        data: {
          status: 'success',
          fee: '5000',
          blockTime: null,
          instructions:
            sig === SIG_A
              ? [{ programId: 'ProgA', programName: 'Unknown', status: 'unknown' as const }]
              : [{ programId: 'ProgB', programName: 'SomeDex', status: 'candidate' as const }],
        },
        justification: 'ok',
      })),
    } as unknown as TransactionIntelligenceAgent;

    const engine = new EvidenceEngine(transactionRetriever, txAgent);
    const result = await engine.buildWalletEvidence(VALID_ADDRESS);

    expect(result.evidenceStatus).toBe(EvidenceStatus.VERIFIED);
    expect(result.data?.transactionsExamined).toBe(2);
    expect(result.data?.transactionsSkipped).toBe(0);
    expect(result.data?.evidence).toHaveLength(2);
    expect(result.data?.evidence[0].confidencePercent).toBe(0); // unknown -> 0
    expect(result.data?.evidence[1].confidencePercent).toBe(50); // candidate -> 50
  });

  it('reports skipped transactions honestly instead of fabricating an entry for them', async () => {
    const transactionRetriever = {
      getWalletTransactionsMeta: vi.fn().mockResolvedValue([meta(SIG_A, 100)]),
    } as unknown as TransactionRetriever;

    const txAgent = {
      parseTx: vi.fn().mockResolvedValue({
        agentId: 'tx_intel_v1',
        timestamp: Date.now(),
        evidenceStatus: EvidenceStatus.UNKNOWN,
        confidenceScore: 0,
        data: null,
        justification: 'not found',
      }),
    } as unknown as TransactionIntelligenceAgent;

    const engine = new EvidenceEngine(transactionRetriever, txAgent);
    const result = await engine.buildWalletEvidence(VALID_ADDRESS);

    expect(result.data?.transactionsSkipped).toBe(1);
    expect(result.data?.evidence).toHaveLength(0);
  });

  it('returns UNKNOWN for an invalid address', async () => {
    const transactionRetriever = {} as unknown as TransactionRetriever;
    const txAgent = {} as unknown as TransactionIntelligenceAgent;

    const engine = new EvidenceEngine(transactionRetriever, txAgent);
    const result = await engine.buildWalletEvidence('not-an-address');

    expect(result.evidenceStatus).toBe(EvidenceStatus.UNKNOWN);
    expect(result.data).toBeNull();
  });
});
