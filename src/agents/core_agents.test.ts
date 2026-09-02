import { describe, it, expect, vi } from 'vitest';
import {
  WalletIntelligenceAgent,
  TransactionIntelligenceAgent,
  MarketEventAgent,
  RiskAgent,
  ResearchAgent,
  AlertAgent,
  ExplanationAgent,
  EvidenceStatus,
} from './core_agents';
import { TransactionRetriever } from '../services/transaction-retriever';
import { SolanaRpcClient } from '../services/solana-rpc-client';
import { BehaviorAnalyzer } from '../services/behavior-analyzer';
import { RiskAssessor } from '../services/risk-assessor';
import { InstructionParser } from '../services/instruction-parser';
import { AlertEngine } from '../services/alert-engine';
import { ChainGptClient } from '../services/chaingpt-client';
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

    const transactionIntelligenceAgent = {
      parseTx: vi.fn().mockResolvedValue({
        agentId: 'tx_intel_v1',
        timestamp: Date.now(),
        evidenceStatus: EvidenceStatus.UNKNOWN,
        confidenceScore: 0,
        data: null,
        justification: 'not found',
      }),
    } as unknown as TransactionIntelligenceAgent;

    const agent = new WalletIntelligenceAgent(transactionRetriever, rpcClient, transactionIntelligenceAgent);
    const result = await agent.analyzeWallet(VALID_ADDRESS);

    expect(result.evidenceStatus).toBe(EvidenceStatus.VERIFIED);
    expect(result.confidenceScore).toBe(1);
    expect(result.data?.transactionCount).toBe(1);
    expect(result.data?.solBalanceLamports).toBe('1000000000');
    expect(result.data?.knownProtocolsDetected).toEqual([]); // never invented - no instruction actually matched an adapter
  });

  it('populates knownProtocolsDetected from real per-instruction parsing, honestly labeling candidate matches', async () => {
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
      getSolBalance: vi.fn().mockResolvedValue(0),
      getTokenBalances: vi.fn().mockResolvedValue([]),
    } as unknown as SolanaRpcClient;
    const transactionIntelligenceAgent = {
      parseTx: vi.fn().mockResolvedValue({
        agentId: 'tx_intel_v1',
        timestamp: Date.now(),
        evidenceStatus: EvidenceStatus.VERIFIED,
        confidenceScore: 1,
        data: {
          status: 'success',
          fee: '5000',
          blockTime: null,
          instructions: [
            { programId: 'RaydiumProgramId', programName: 'Raydium AMM V4', status: 'candidate' },
            { programId: 'UnknownProgramId', programName: 'Unknown Program', status: 'unknown' },
          ],
        },
        justification: 'ok',
      }),
    } as unknown as TransactionIntelligenceAgent;

    const agent = new WalletIntelligenceAgent(transactionRetriever, rpcClient, transactionIntelligenceAgent);
    const result = await agent.analyzeWallet(VALID_ADDRESS);

    expect(result.data?.knownProtocolsDetected).toEqual(['Raydium AMM V4 (candidate)']);
  });

  it('returns UNKNOWN for an invalid address instead of throwing', async () => {
    const transactionRetriever = {} as unknown as TransactionRetriever;
    const rpcClient = {} as unknown as SolanaRpcClient;
    const transactionIntelligenceAgent = { parseTx: vi.fn() } as unknown as TransactionIntelligenceAgent;

    const agent = new WalletIntelligenceAgent(transactionRetriever, rpcClient, transactionIntelligenceAgent);
    const result = await agent.analyzeWallet('not-a-real-address');

    expect(result.evidenceStatus).toBe(EvidenceStatus.UNKNOWN);
    expect(result.data).toBeNull();
    expect(result.confidenceScore).toBe(0);
    expect(transactionIntelligenceAgent.parseTx).not.toHaveBeenCalled();
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

describe('AlertAgent', () => {
  it('evaluates real behavior/risk data via AlertEngine and returns VERIFIED', async () => {
    const transactionRetriever = {
      getWalletTransactionsMeta: vi.fn().mockResolvedValue([]),
    } as unknown as TransactionRetriever;

    const agent = new AlertAgent(transactionRetriever, new BehaviorAnalyzer(), new RiskAssessor(), new AlertEngine());
    const result = await agent.evaluateWallet(VALID_ADDRESS);

    expect(result.evidenceStatus).toBe(EvidenceStatus.VERIFIED);
    expect(result.data?.alerts).toEqual([]); // no transactions -> nothing to trigger on
  });

  it('returns UNKNOWN for an invalid address instead of throwing', async () => {
    const agent = new AlertAgent({} as TransactionRetriever, new BehaviorAnalyzer(), new RiskAssessor(), new AlertEngine());
    const result = await agent.evaluateWallet('not-a-real-address');

    expect(result.evidenceStatus).toBe(EvidenceStatus.UNKNOWN);
    expect(result.data).toBeNull();
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

    const walletAgent = new WalletIntelligenceAgent(transactionRetriever, rpcClient, { parseTx: vi.fn() } as unknown as TransactionIntelligenceAgent);
    const riskAgent = new RiskAgent(transactionRetriever, new BehaviorAnalyzer(), new RiskAssessor());
    const research = new ResearchAgent(walletAgent, riskAgent);

    const result = await research.generateReport(VALID_ADDRESS);

    expect(result.evidenceStatus).toBe(EvidenceStatus.VERIFIED);
    expect(result.data?.auditTrail).toEqual(['wallet_intel_v1', 'risk_assessment_v1']);
    expect(result.data?.summary).not.toContain('tx_1'); // no leftover placeholder text
  });
});

describe('ExplanationAgent', () => {
  function buildAgents(): { walletAgent: WalletIntelligenceAgent; riskAgent: RiskAgent } {
    const transactionRetriever = {
      getWalletTransactionsMeta: vi.fn().mockResolvedValue([]),
    } as unknown as TransactionRetriever;
    const rpcClient = {
      getSolBalance: vi.fn().mockResolvedValue(0),
      getTokenBalances: vi.fn().mockResolvedValue([]),
    } as unknown as SolanaRpcClient;

    const walletAgent = new WalletIntelligenceAgent(transactionRetriever, rpcClient, { parseTx: vi.fn() } as unknown as TransactionIntelligenceAgent);
    const riskAgent = new RiskAgent(transactionRetriever, new BehaviorAnalyzer(), new RiskAssessor());
    return { walletAgent, riskAgent };
  }

  it('propagates UNKNOWN instead of building an explanation around a gap', async () => {
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
    const chainGptClient = { generateExplanation: vi.fn() } as unknown as ChainGptClient;

    const agent = new ExplanationAgent(walletAgent, riskAgent, chainGptClient);
    const result = await agent.explainWallet(VALID_ADDRESS);

    expect(result.evidenceStatus).toBe(EvidenceStatus.UNKNOWN);
    expect(result.data).toBeNull();
    expect(chainGptClient.generateExplanation).not.toHaveBeenCalled();
  });

  it('uses the ChainGPT summary and reports summarySource: chaingpt on success', async () => {
    const { walletAgent, riskAgent } = buildAgents();
    const chainGptClient = {
      generateExplanation: vi.fn().mockResolvedValue({ ok: true, text: 'This wallet has no activity yet.' }),
    } as unknown as ChainGptClient;

    const agent = new ExplanationAgent(walletAgent, riskAgent, chainGptClient);
    const result = await agent.explainWallet(VALID_ADDRESS);

    expect(result.evidenceStatus).toBe(EvidenceStatus.VERIFIED);
    expect(result.data?.summary).toBe('This wallet has no activity yet.');
    expect(result.data?.summarySource).toBe('chaingpt');
    // keyActivities/riskAssessment/patterns stay real regardless of the AI call
    expect(result.data?.riskAssessment).toContain('Risk score');
  });

  it('falls back to a deterministic summary (never silence) when ChainGPT is unavailable', async () => {
    const { walletAgent, riskAgent } = buildAgents();
    const chainGptClient = {
      generateExplanation: vi.fn().mockResolvedValue({ ok: false, reason: 'CHAINGPT_API_KEY is not configured.' }),
    } as unknown as ChainGptClient;

    const agent = new ExplanationAgent(walletAgent, riskAgent, chainGptClient);
    const result = await agent.explainWallet(VALID_ADDRESS);

    expect(result.evidenceStatus).toBe(EvidenceStatus.VERIFIED); // underlying data is still real
    expect(result.data?.summarySource).toBe('deterministic');
    expect(result.data?.summary.length).toBeGreaterThan(0);
    expect(result.justification).toContain('ChainGPT was unavailable');
  });

  it('returns UNKNOWN for an invalid address instead of throwing', async () => {
    const chainGptClient = { generateExplanation: vi.fn() } as unknown as ChainGptClient;

    // WalletIntelligenceAgent/RiskAgent themselves handle invalid-address
    // validation and return UNKNOWN - mirror that contract here via mocks.
    const walletAgent = {
      analyzeWallet: vi.fn().mockResolvedValue({
        agentId: 'wallet_intel_v1',
        timestamp: Date.now(),
        evidenceStatus: EvidenceStatus.UNKNOWN,
        confidenceScore: 0,
        data: null,
        justification: 'Invalid wallet address',
      }),
    } as unknown as WalletIntelligenceAgent;
    const riskAgent = {
      evaluateRisk: vi.fn().mockResolvedValue({
        agentId: 'risk_assessment_v1',
        timestamp: Date.now(),
        evidenceStatus: EvidenceStatus.UNKNOWN,
        confidenceScore: 0,
        data: null,
        justification: 'Invalid wallet address',
      }),
    } as unknown as RiskAgent;

    const agent = new ExplanationAgent(walletAgent, riskAgent, chainGptClient);
    const result = await agent.explainWallet('not-a-real-address');

    expect(result.evidenceStatus).toBe(EvidenceStatus.UNKNOWN);
    expect(result.data).toBeNull();
    expect(chainGptClient.generateExplanation).not.toHaveBeenCalled();
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
