import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { APIServer } from '../api/server';
import { BehaviorAnalyzer } from '../services/behavior-analyzer';
import { IntelligenceScorer } from '../services/intelligence-scorer';
import { RiskAssessor } from '../services/risk-assessor';
import { StubPriceProvider } from '../services/price-provider';
import { DexRegistry } from '../services/dex-registry';
import { EvidenceEngine } from '../agents/evidence-engine';
import { ResearchAgent, WalletIntelligenceAgent, AlertAgent, ExplanationAgent, EvidenceStatus } from '../agents/core_agents';
import { LiveAlertWatcher } from '../services/live-alert-watcher';
import { AgentRouter } from '../agents/agent-router';
import { TransactionMeta, validateTransactionSignature, validateWalletAddress } from '../types/domain';

describe('API Server', () => {
  // Duck-typed partial mocks of the real agent/service classes below -
  // `any` here is deliberate (this suite exercises HTTP wiring only; each
  // real collaborator is unit-tested on its own in src/agents/*.test.ts
  // and src/services/*.test.ts), not a stand-in for a missing real type.
  /* eslint-disable @typescript-eslint/no-explicit-any */
  let app: any;
  let server: APIServer;
  let mockTransactionRetriever: any;
  let mockEvidenceEngine: any;
  let mockResearchAgent: any;
  let mockWalletAgent: any;
  let mockAgentRouter: any;
  let mockAlertAgent: any;
  let mockExplanationAgent: any;
  let mockLiveAlertWatcher: any;
  let mockPriceProvider: any;
  /* eslint-enable @typescript-eslint/no-explicit-any */

  beforeEach(() => {
    // Wraps StubPriceProvider so isHealthy can be overridden per test - the
    // health route's handling of a failing dependency is part of what this
    // suite checks.
    const stub = new StubPriceProvider();
    mockPriceProvider = {
      getPrice: stub.getPrice.bind(stub),
      isHealthy: vi.fn().mockResolvedValue(true),
    };

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
    mockWalletAgent = {
      analyzeWallet: vi.fn().mockResolvedValue({
        agentId: 'wallet_intel_v1',
        timestamp: Date.now(),
        evidenceStatus: EvidenceStatus.VERIFIED,
        confidenceScore: 1,
        data: {
          transactionCount: 0,
          successfulTransactions: 0,
          failedTransactions: 0,
          solBalanceLamports: '0',
          tokenBalances: [{ mint: 'So1111...', amount: '100', decimals: 6 }],
          knownProtocolsDetected: [],
        },
        justification: 'test',
      }),
    };
    mockAgentRouter = {
      route: vi.fn().mockResolvedValue({
        agentId: 'wallet_intel_v1',
        timestamp: Date.now(),
        evidenceStatus: EvidenceStatus.VERIFIED,
        confidenceScore: 1,
        data: {},
        justification: 'test',
      }),
    };
    mockAlertAgent = {
      evaluateWallet: vi.fn().mockResolvedValue({
        agentId: 'alert_agent_v1',
        timestamp: Date.now(),
        evidenceStatus: EvidenceStatus.VERIFIED,
        confidenceScore: 1,
        data: { alerts: [] },
        justification: 'test',
      }),
    };
    mockExplanationAgent = {
      explainWallet: vi.fn().mockResolvedValue({
        agentId: 'explanation_v1',
        timestamp: Date.now(),
        evidenceStatus: EvidenceStatus.VERIFIED,
        confidenceScore: 1,
        data: {
          summary: 'test summary',
          summarySource: 'deterministic',
          keyActivities: [],
          riskAssessment: 'Risk score 0/100 (low).',
          patterns: [],
          disclaimer: 'test',
        },
        justification: 'test',
      }),
    };
    mockLiveAlertWatcher = {
      watch: vi.fn().mockReturnValue({ stop: vi.fn().mockResolvedValue(undefined) }),
    };

    // Create server with mocked services
    server = new APIServer(
      3000,
      mockTransactionRetriever,
      new BehaviorAnalyzer(),
      new IntelligenceScorer(),
      new RiskAssessor(),
      mockPriceProvider as StubPriceProvider,
      new DexRegistry(),
      mockEvidenceEngine as EvidenceEngine,
      mockResearchAgent as ResearchAgent,
      mockWalletAgent as WalletIntelligenceAgent,
      mockAgentRouter as AgentRouter,
      mockAlertAgent as AlertAgent,
      mockExplanationAgent as ExplanationAgent,
      mockLiveAlertWatcher as LiveAlertWatcher
    );

    app = server.getApp();
  });

  describe('GET /', () => {
    it('should serve a service index rather than 404', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body.service).toBe('FactLedger');
      expect(response.body.health).toBe('/api/v1/health');
      expect(response.body.endpoints.token).toContain('/api/v1/token/:mint/security');
    });

    it('should be reachable without an API key', async () => {
      process.env.API_KEYS = 'secret-key-for-this-test';
      try {
        const response = await request(app).get('/');
        expect(response.status).toBe(200);
      } finally {
        delete process.env.API_KEYS;
      }
    });
  });

  describe('Caching', () => {
    // Regression: responses carried no Cache-Control, so browsers applied
    // heuristic caching and kept replaying a stale body for the same URL —
    // which made a working deployment look dead, because the browser was
    // still serving a 404 captured before the service went live.
    it('should forbid caching of API responses', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.headers['cache-control']).toContain('no-store');
    });

    it('should forbid caching of the service index', async () => {
      const response = await request(app).get('/');

      expect(response.headers['cache-control']).toContain('no-store');
    });
  });

  describe('Rate limiting', () => {
    // Regression: the general limiter had no skip, so a platform health check
    // could be answered with 429 once other traffic used the window up. The
    // platform reads that as the service being down.
    it('should not throttle the liveness endpoints', async () => {
      for (let i = 0; i < 65; i++) {
        await request(app).get('/api/v1/health');
      }
      const response = await request(app).get('/api/v1/health');

      expect(response.status).toBe(200);
    });

    it('should not throttle the service index', async () => {
      for (let i = 0; i < 65; i++) {
        await request(app).get('/');
      }
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/v1/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.service).toBe('FactLedger');
      expect(response.body.version).toBe('0.1.0');
    });

    // Regression: this used to await an outbound CoinGecko call and answer 503
    // when it failed, so a platform health check pointed here would tear the
    // service down because a third party was rate-limiting us.
    it('should stay 200 when the price provider is unhealthy', async () => {
      mockPriceProvider.isHealthy = vi.fn().mockResolvedValue(false);

      const response = await request(app).get('/api/v1/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.dependencies.priceProvider).toBe('degraded');
    });

    it('should stay 200 when the price provider check rejects', async () => {
      mockPriceProvider.isHealthy = vi.fn().mockRejectedValue(new Error('network down'));

      const response = await request(app).get('/api/v1/health');

      expect(response.status).toBe(200);
      expect(response.body.dependencies.priceProvider).toBe('degraded');
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
      // Risk route's disclaimer embeds the phrase mid-sentence, lowercase
      // ("...This is not financial advice and should not be used...") -
      // unlike the intelligence route's disclaimer above, which ends with
      // it capitalized as a standalone sentence. Match what's actually
      // there instead of assuming both routes share identical wording.
      expect(response.body.disclaimer).toContain('not financial advice');
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
    it('should return real token balances from WalletIntelligenceAgent, not a placeholder', async () => {
      const address = validateWalletAddress('11111111111111111111111111111112');

      const response = await request(app).get(`/api/v1/wallet/${address}/tokens`);

      expect(response.status).toBe(200);
      expect(response.body.wallet).toBe(address);
      expect(response.body.tokens).toEqual([{ mint: 'So1111...', amount: '100', decimals: 6 }]);
      expect(response.body.evidenceStatus).toBe(EvidenceStatus.VERIFIED);
      expect(mockWalletAgent.analyzeWallet).toHaveBeenCalledWith(address);
    });
  });

  describe('GET /api/v1/agents/:intent', () => {
    it('dispatches a valid intent to the AgentRouter with parsed query params', async () => {
      const address = validateWalletAddress('11111111111111111111111111111112');

      const response = await request(app).get(`/api/v1/agents/wallet_overview`).query({ address, limit: 5 });

      expect(response.status).toBe(200);
      expect(response.body.intent).toBe('wallet_overview');
      expect(mockAgentRouter.route).toHaveBeenCalledWith('wallet_overview', {
        address,
        signature: undefined,
        topic: undefined,
        limit: 5,
      });
    });

    it('rejects an unknown intent with 400 instead of forwarding it to the router', async () => {
      const response = await request(app).get('/api/v1/agents/not_a_real_intent');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(mockAgentRouter.route).not.toHaveBeenCalled();
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

  describe('GET /api/v1/wallet/:address/alerts', () => {
    it('should return the alert agent evaluation', async () => {
      const address = validateWalletAddress('11111111111111111111111111111112');

      const response = await request(app).get(`/api/v1/wallet/${address}/alerts`);

      expect(response.status).toBe(200);
      expect(response.body.wallet).toBe(address);
      expect(response.body.data.alerts).toEqual([]);
      expect(mockAlertAgent.evaluateWallet).toHaveBeenCalledWith(address, 100);
    });
  });

  describe('GET /api/v1/wallet/:address/explanation', () => {
    it('should return the explanation agent output', async () => {
      const address = validateWalletAddress('11111111111111111111111111111112');

      const response = await request(app).get(`/api/v1/wallet/${address}/explanation`);

      expect(response.status).toBe(200);
      expect(response.body.wallet).toBe(address);
      expect(response.body.data.summary).toBe('test summary');
      expect(response.body.data.summarySource).toBe('deterministic');
      expect(mockExplanationAgent.explainWallet).toHaveBeenCalledWith(address, 100);
    });
  });

  describe('GET /api/v1/wallet/:address/alerts/stream', () => {
    it('rejects an invalid address with 400 via the centralized error handler (not a hang)', async () => {
      // Also a regression test for asyncHandler(): before it existed, a
      // throw inside an async route handler became an unhandled promise
      // rejection instead of ever reaching this response.
      const response = await request(app).get('/api/v1/wallet/not-a-real-address/alerts/stream');

      expect(response.status).toBe(400);
      expect(mockLiveAlertWatcher.watch).not.toHaveBeenCalled();
    });

    // The happy path (opening the SSE stream, receiving alert events) is
    // deliberately not covered here via supertest: the stream never ends
    // on its own, and a full HTTP round-trip test would either hang the
    // suite or require reaching into supertest/superagent internals in a
    // way that hasn't been verified to behave correctly in this sandbox
    // (npm install is blocked - see CLAUDE.md). LiveAlertWatcher's own
    // subscription/dedupe logic is covered directly in
    // live-alert-watcher.test.ts instead.
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
