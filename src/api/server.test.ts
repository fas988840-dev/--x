import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Express } from 'express';
import { APIServer } from '../api/server';
import { BehaviorAnalyzer } from '../services/behavior-analyzer';
import { IntelligenceScorer } from '../services/intelligence-scorer';
import { RiskAssessor } from '../services/risk-assessor';
import { StubPriceProvider } from '../services/price-provider';
import { DexRegistry } from '../services/dex-registry';
import { TransactionRetriever } from '../services/transaction-retriever';
import { EvidenceEngine } from '../agents/evidence-engine';
import { ResearchAgent, EvidenceStatus } from '../agents/core_agents';
import { TransactionMeta, validateTransactionSignature, validateWalletAddress } from '../types/domain';

type MockFn = ReturnType<typeof vi.fn>;

describe('API Server', () => {
  let app: Express;
  let server: APIServer;
  let mockTransactionRetriever: { getWalletTransactionsMeta: MockFn; getTransaction: MockFn };
  let mockEvidenceEngine: { buildWalletEvidence: MockFn };
  let mockResearchAgent: { generateReport: MockFn };

  beforeEach(() => {
    // Mock transaction retriever
    mockTransactionRetriever = {
      getWalletTransactionsMeta: vi.fn(),
      getTransaction: vi.fn(),
    };

    // Mock the agent-based collaborators (unit-tested on their own in
    // src/agents/*.test.ts) so this suite stays focused on HTTP wiring.
    mockEvidenceEngine = {
      buildWalletEvidence: vi.fn().mockResolvedValue({
        agentId: 'evidence_engine_v1',
        timestamp: Date.now(),
        evidenceStatus: EvidenceStatus.VERIFIED,
        confidenceScore: 1,
        data: { wallet: '', transactionsExamined: 0, transactionsSkipped: 0, evidence: [] },
        justification: 'test',
      }),
    };
    mockResearchAgent = {
      generateReport: vi.fn().mockResolvedValue({
        agentId: 'research_synth_v1',
        timestamp: Date.now(),
        evidenceStatus: EvidenceStatus.VERIFIED,
        confidenceScore: 1,
        data: { summary: 'test summary', auditTrail: ['wallet_intel_v1', 'risk_assessment_v1'] },
        justification: 'test',
      }),
    };

    // Create server with mocked services
    server = new APIServer(
      3000,
      mockTransactionRetriever as unknown as TransactionRetriever,
      new BehaviorAnalyzer(),
      new IntelligenceScorer(),
      new RiskAssessor(),
      new StubPriceProvider(),
      new DexRegistry(),
      mockEvidenceEngine as EvidenceEngine,
      mockResearchAgent as ResearchAgent
    );

    app = server.getApp();
  });

  describe('GET /api/v1/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.service).toBe('FactLedger');
      expect(response.body.version).toBe('0.1.0');
    });
  });

  describe('GET /api/v1/wallet/:address/transactions', () => {
    it('should return wallet transactions', async () => {
      const address = validateWalletAddress('11111111111111111111111111111112');
      const mockTx: TransactionMeta = {
        signature: validateTransactionSignature(
          '4MkLRHFdBJnPhKMVPy8gWXVwP8eA2CUyHhXmw3HzHrxP7a8H9LJ3JHcLhJPJ9Z2L3GJ6BL7Q5KJ9P2B3L6M5N8Z'
        ),
        slot: 100,
        blockTime: null,
        status: 'success',
        fee: '5000',
        logMessages: [],
      };

      mockTransactionRetriever.getWalletTransactionsMeta.mockResolvedValue([mockTx]);

      const response = await request(app)
        .get(`/api/v1/wallet/${address}/transactions`)
        .query({ limit: 100 });

      expect(response.status).toBe(200);
      expect(response.body.wallet).toBe(address);
      expect(response.body.transactions).toHaveLength(1);
      expect(response.body.transactions[0].status).toBe('success');
    });

    it('should reject invalid wallet address', async () => {
      const response = await request(app).get('/api/v1/wallet/invalid/transactions');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should limit transaction count', async () => {
      const address = validateWalletAddress('11111111111111111111111111111112');
      mockTransactionRetriever.getWalletTransactionsMeta.mockResolvedValue([]);

      const response = await request(app)
        .get(`/api/v1/wallet/${address}/transactions`)
        .query({ limit: 5000 }); // Try to exceed limit

      expect(response.status).toBe(200);
      expect(mockTransactionRetriever.getWalletTransactionsMeta).toHaveBeenCalledWith(address, 1000); // Capped at 1000
    });
  });

  describe('GET /api/v1/wallet/:address/behavior', () => {
    it('should return wallet behavior', async () => {
      const address = validateWalletAddress('11111111111111111111111111111112');
      const mockTx: TransactionMeta = {
        signature: validateTransactionSignature(
          '4MkLRHFdBJnPhKMVPy8gWXVwP8eA2CUyHhXmw3HzHrxP7a8H9LJ3JHcLhJPJ9Z2L3GJ6BL7Q5KJ9P2B3L6M5N8Z'
        ),
        slot: 100,
        blockTime: 1000000000,
        status: 'success',
        fee: '5000',
        logMessages: [],
      };

      mockTransactionRetriever.getWalletTransactionsMeta.mockResolvedValue([mockTx]);

      const response = await request(app).get(`/api/v1/wallet/${address}/behavior`);

      expect(response.status).toBe(200);
      expect(response.body.wallet).toBe(address);
      expect(response.body.behavior.transactionCount).toBe(1);
      expect(response.body.behavior.failureRate).toBe(0);
    });
  });

  describe('GET /api/v1/wallet/:address/intelligence', () => {
    it('should return intelligence score', async () => {
      const address = validateWalletAddress('11111111111111111111111111111112');
      mockTransactionRetriever.getWalletTransactionsMeta.mockResolvedValue([]);

      const response = await request(app).get(`/api/v1/wallet/${address}/intelligence`);

      expect(response.status).toBe(200);
      expect(response.body.wallet).toBe(address);
      expect(response.body.intelligence.score).toBeDefined();
      expect(response.body.intelligence.components).toBeDefined();
      expect(response.body.intelligence.factors).toBeDefined();
      expect(response.body.disclaimer).toContain('Not financial advice');
    });
  });

  describe('GET /api/v1/wallet/:address/risk', () => {
    it('should return risk assessment', async () => {
      const address = validateWalletAddress('11111111111111111111111111111112');
      mockTransactionRetriever.getWalletTransactionsMeta.mockResolvedValue([]);

      const response = await request(app).get(`/api/v1/wallet/${address}/risk`);

      expect(response.status).toBe(200);
      expect(response.body.wallet).toBe(address);
      expect(response.body.risk.score).toBeDefined();
      expect(response.body.risk.level).toMatch(/low|medium|high/);
      expect(response.body.risk.factors).toBeDefined();
      expect(response.body.risk.reasoning).toBeDefined();
      expect(response.body.disclaimer).toContain('Not financial advice');
    });
  });

  describe('GET /api/v1/wallet/:address/analysis', () => {
    it('should return full wallet analysis', async () => {
      const address = validateWalletAddress('11111111111111111111111111111112');
      mockTransactionRetriever.getWalletTransactionsMeta.mockResolvedValue([]);

      const response = await request(app).get(`/api/v1/wallet/${address}/analysis`);

      expect(response.status).toBe(200);
      expect(response.body.wallet).toBe(address);
      expect(response.body.observableData).toBeDefined();
      expect(response.body.behavior).toBeDefined();
      expect(response.body.intelligence).toBeDefined();
      expect(response.body.risk).toBeDefined();
      expect(response.body.disclaimer).toBeDefined();
    });

    it('should separate observable facts from derived metrics', async () => {
      const address = validateWalletAddress('11111111111111111111111111111112');
      mockTransactionRetriever.getWalletTransactionsMeta.mockResolvedValue([]);

      const response = await request(app).get(`/api/v1/wallet/${address}/analysis`);

      expect(response.body.observableData).toBeDefined();
      expect(response.body.observableData.transactionCount).toBeDefined();
      expect(response.body.intelligence).toBeDefined();
      expect(response.body.risk).toBeDefined();
    });
  });

  describe('GET /api/v1/transaction/:signature', () => {
    it('should return transaction details', async () => {
      const signature = validateTransactionSignature(
        '4MkLRHFdBJnPhKMVPy8gWXVwP8eA2CUyHhXmw3HzHrxP7a8H9LJ3JHcLhJPJ9Z2L3GJ6BL7Q5KJ9P2B3L6M5N8Z'
      );
      const mockTx: TransactionMeta = {
        signature,
        slot: 100,
        blockTime: 1000000000,
        status: 'success',
        fee: '5000',
        logMessages: [],
      };

      mockTransactionRetriever.getTransaction.mockResolvedValue(mockTx);

      const response = await request(app).get(`/api/v1/transaction/${signature}`);

      expect(response.status).toBe(200);
      expect(response.body.signature).toBe(signature);
      expect(response.body.transaction.status).toBe('success');
    });

    it('should reject invalid transaction signature', async () => {
      const response = await request(app).get('/api/v1/transaction/invalid');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 for non-existent transaction', async () => {
      const signature = validateTransactionSignature(
        '4MkLRHFdBJnPhKMVPy8gWXVwP8eA2CUyHhXmw3HzHrxP7a8H9LJ3JHcLhJPJ9Z2L3GJ6BL7Q5KJ9P2B3L6M5N8Z'
      );
      mockTransactionRetriever.getTransaction.mockResolvedValue(null);

      const response = await request(app).get(`/api/v1/transaction/${signature}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/v1/wallet/:address/tokens', () => {
    it('should return wallet tokens', async () => {
      const address = validateWalletAddress('11111111111111111111111111111112');

      const response = await request(app).get(`/api/v1/wallet/${address}/tokens`);

      expect(response.status).toBe(200);
      expect(response.body.wallet).toBe(address);
      expect(response.body.tokens).toBeDefined();
      expect(response.body.disclaimer).toBeDefined();
    });
  });

  describe('GET /api/v1/wallet/:address/evidence', () => {
    it('should return the evidence engine result, capped at a lower default limit', async () => {
      const address = validateWalletAddress('11111111111111111111111111111112');

      const response = await request(app).get(`/api/v1/wallet/${address}/evidence`);

      expect(response.status).toBe(200);
      expect(response.body.wallet).toBe(address);
      expect(response.body.evidenceStatus).toBe(EvidenceStatus.VERIFIED);
      expect(response.body.data.evidence).toEqual([]);
      expect(mockEvidenceEngine.buildWalletEvidence).toHaveBeenCalledWith(address, 10);
    });
  });

  describe('GET /api/v1/wallet/:address/research', () => {
    it('should return the research agent synthesis', async () => {
      const address = validateWalletAddress('11111111111111111111111111111112');

      const response = await request(app).get(`/api/v1/wallet/${address}/research`);

      expect(response.status).toBe(200);
      expect(response.body.wallet).toBe(address);
      expect(response.body.data.auditTrail).toEqual(['wallet_intel_v1', 'risk_assessment_v1']);
    });
  });

  describe('GET /api/v1/protocols', () => {
    it('returns an empty list rather than a fabricated one - DexRegistry has no adapters registered', async () => {
      const response = await request(app).get('/api/v1/protocols');

      expect(response.status).toBe(200);
      expect(response.body.protocols).toEqual([]);
      expect(response.body.disclaimer).toContain('No DEX protocol adapters');
    });
  });

  describe('404 Not Found', () => {
    it('should return 404 for unknown endpoint', async () => {
      const response = await request(app).get('/api/v1/unknown/endpoint');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .set('Origin', 'http://localhost:3000');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle RPC errors gracefully', async () => {
      const address = validateWalletAddress('11111111111111111111111111111112');

      mockTransactionRetriever.getWalletTransactionsMeta.mockRejectedValue(
        new Error('RPC connection failed')
      );

      const response = await request(app).get(`/api/v1/wallet/${address}/transactions`);

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toBeDefined();
      // Should not expose internal details in production
      expect(response.body.stack).toBeUndefined();
    });
  });
});
