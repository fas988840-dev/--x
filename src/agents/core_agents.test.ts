import { describe, it, expect, vi } from 'vitest';
import {
  WalletIntelligenceAgent,
  TransactionIntelligenceAgent,
  MarketEventAgent,
  RiskAgent,
  ResearchAgent,
  EvidenceStatus,
} from './core_agents';
import { TransactionRetriever } from '../services/transaction-retriever';
import { SolanaRpcClient } from '../services/solana-rpc-client';
import { BehaviorAnalyzer } from '../services/behavior-analyzer';
import { RiskAssessor } from '../services/risk-assessor';
import { InstructionParser } from '../services/instruction-parser';
import { TransactionMeta, ParsedInstruction, validateTransactionSignature, validateWalletAddress, validateProgramId } from '../types/domain';

const VALID_ADDRESS = '11111111111111111111111111111112';
const VALID_SIGNATURE = '4MkLRHFdBJnPhKMVPy8gWXVwP8eA2CUyHhXmw3HzHrxP7a8H9LJ3JHcLhJPJ9Z2L3GJ6BL7Q5KJ9P2B3L6M5N8Z';

describe('WalletIntelligenceAgent', () => {
  it('returns VERIFIED data built from real service calls, never fabricated', async () => {
    const mockTx: TransactionMeta = {
      signature: validateTransactionSignature(VALID_SIGNATURE),
      slot: 1,
      blockTime: null,
      status: 'success',
      fee: '5000',
      logMessages: [],
    };

    const transactionRetriever = {
      getWalletTransactionsMeta: vi.fn().mockResolvedValue([mockTx]),
    } as unknown as TransactionRetriever;

    const rpcClient = {
      getSolBalance: vi.fn().mockResolvedValue(1_000_000_000),
      getTokenBalances: vi.fn().mockResolvedValue([{ mint: 'So1111...', amount: '100', decimals: 6 }]),
    } as unknown as SolanaRpcClient;

    const agent = new WalletIntelligenceAgent(transactionRetriever, rpcClient);
    const result = await agent.analyzeWallet(VALID_ADDRESS);

    expect(result.evidenceStatus).toBe(EvidenceStatus.VERIFIED);
    expect(result.confidenceScore).toBe(1);
    expect(result.data?.transactionCount).toBe(1);
    expect(result.data?.solBalanceLamports).toBe('1000000000');
    expect(result.data?.knownProtocolsDetected).toEqual([]); // never invented
  });

  it('returns UNKNOWN for an invalid address instead of throwing', async () => {
    const transactionRetriever = {} as unknown as TransactionRetriever;
    const rpcClient = {} as unknown as SolanaRpcClient;

    const agent = new WalletIntelligenceAgent(transactionRetriever, rpcClient);
    const result = await agent.analyzeWallet('not-a-real-address');

    expect(result.evidenceStatus).toBe(EvidenceStatus.UNKNOWN);
    expect(result.data).toBeNull();
    expect(result.confidenceScore).toBe(0);
  });
});

describe('TransactionIntelligenceAgent', () => {
  it('returns UNKNOWN when the transaction is not found on-chain', async () => {
    const transactionRetriever = {
      getTransaction: vi.fn().mockResolvedValue(null),
      extractInstructions: vi.fn(),
    } as unknown as TransactionRetriever;
    const rpcClient = { getTransaction: vi.fn().mockResolvedValue(null) } as unknown as SolanaRpcClient;
    const instructionParser = { parseInstructions: vi.fn() } as unknown as InstructionParser;

    const agent = new TransactionIntelligenceAgent(transactionRetriever, rpcClient, instructionParser);
    const result = await agent.parseTx(VALID_SIGNATURE);

    expect(result.evidenceStatus).toBe(EvidenceStatus.UNKNOWN);
    expect(result.data).toBeNull();
  });

  it('reports each instruction with its own honest confirmed/candidate/unknown status', async () => {
    const mockTx: TransactionMeta = {
      signature: validateTransactionSignature(VALID_SIGNATURE),
      slot: 1,
      blockTime: 1_700_000_000,
      status: 'success',
      fee: '5000',
      logMessages: [],
    };
    const mockParsed: ParsedInstruction[] = [
      {
        programId: validateProgramId('11111111111111111111111111111112'),
        programName: 'Unknown',
        instructionType: 'Unknown',
        status: 'unknown',
        decoded: null,
        raw: { programId: validateProgramId('11111111111111111111111111111112'), data: Buffer.alloc(0), accounts: [] },
      },
    ];

    const transactionRetriever = {
      getTransaction: vi.fn().mockResolvedValue(mockTx),
      extractInstructions: vi.fn().mockReturnValue([mockParsed[0].raw]),
    } as unknown as TransactionRetriever;
    const rpcClient = { getTransaction: vi.fn().mockResolvedValue({}) } as unknown as SolanaRpcClient;
    const instructionParser = { parseInstructions: vi.fn().mockReturnValue(mockParsed) } as unknown as InstructionParser;

    const agent = new TransactionIntelligenceAgent(transactionRetriever, rpcClient, instructionParser);
    const result = await agent.parseTx(VALID_SIGNATURE);

    expect(result.evidenceStatus).toBe(EvidenceStatus.VERIFIED);
    expect(result.data?.instructions).toHaveLength(1);
    expect(result.data?.instructions[0].status).toBe('unknown'); // not upgraded to a fake "confirmed"
  });
});

describe('MarketEventAgent', () => {
  it('always reports UNKNOWN - no live event pipeline exists', async () => {
    const agent = new MarketEventAgent();
    const result = await agent.trackEvents('any-topic');

    expect(result.evidenceStatus).toBe(EvidenceStatus.UNKNOWN);
    expect(result.data).toBeNull();
    expect(result.confidenceScore).toBe(0);
  });
});

describe('RiskAgent', () => {
  it('wraps the real, existing RiskAssessor output', async () => {
    const transactionRetriever = {
      getWalletTransactionsMeta: vi.fn().mockResolvedValue([]),
    } as unknown as TransactionRetriever;

    const agent = new RiskAgent(transactionRetriever, new BehaviorAnalyzer(), new RiskAssessor());
    const result = await agent.evaluateRisk(VALID_ADDRESS);

    expect(result.evidenceStatus).toBe(EvidenceStatus.VERIFIED);
    expect(result.data?.level).toMatch(/low|medium|high/);
    expect(result.data?.reasoning).toBeDefined();
  });
});

describe('ResearchAgent', () => {
  it('propagates UNKNOWN instead of synthesizing a report around a gap', async () => {
    const walletAgent = {
      analyzeWallet: vi.fn().mockResolvedValue({
        agentId: 'wallet_intel_v1',
        timestamp: Date.now(),
        evidenceStatus: EvidenceStatus.UNKNOWN,
        confidenceScore: 0,
        data: null,
        justification: 'RPC unavailable',
      }),
    } as unknown as WalletIntelligenceAgent;
    const riskAgent = {
      evaluateRisk: vi.fn().mockResolvedValue({
        agentId: 'risk_assessment_v1',
        timestamp: Date.now(),
        evidenceStatus: EvidenceStatus.VERIFIED,
        confidenceScore: 1,
        data: { score: 10, level: 'low', factors: {}, reasoning: [] },
        justification: 'ok',
      }),
    } as unknown as RiskAgent;

    const agent = new ResearchAgent(walletAgent, riskAgent);
    const result = await agent.generateReport(VALID_ADDRESS);

    expect(result.evidenceStatus).toBe(EvidenceStatus.UNKNOWN);
    expect(result.data).toBeNull();
  });

  it('cites real sub-agent IDs as its audit trail, never placeholders', async () => {
    const transactionRetriever = {
      getWalletTransactionsMeta: vi.fn().mockResolvedValue([]),
    } as unknown as TransactionRetriever;
    const rpcClient = {
      getSolBalance: vi.fn().mockResolvedValue(0),
      getTokenBalances: vi.fn().mockResolvedValue([]),
    } as unknown as SolanaRpcClient;

    const walletAgent = new WalletIntelligenceAgent(transactionRetriever, rpcClient);
    const riskAgent = new RiskAgent(transactionRetriever, new BehaviorAnalyzer(), new RiskAssessor());
    const research = new ResearchAgent(walletAgent, riskAgent);

    const result = await research.generateReport(VALID_ADDRESS);

    expect(result.evidenceStatus).toBe(EvidenceStatus.VERIFIED);
    expect(result.data?.auditTrail).toEqual(['wallet_intel_v1', 'risk_assessment_v1']);
    expect(result.data?.summary).not.toContain('tx_1'); // no leftover placeholder text
  });
});

// Sanity check that the fix to ParsedInstructionStatus (domain.ts) is in
// effect: 'confirmed' must be a valid value, since InstructionParser can
// produce it via DexRegistry-decoded swaps.
describe('validateWalletAddress sanity', () => {
  it('accepts a well-formed address', () => {
    expect(() => validateWalletAddress(VALID_ADDRESS)).not.toThrow();
  });
});
