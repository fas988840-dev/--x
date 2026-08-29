import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { APIServer } from '../api/server';
import { SolanaRpcClient } from '../services/solana-rpc-client';
import { TransactionRetriever } from '../services/transaction-retriever';
import { BehaviorAnalyzer } from '../services/behavior-analyzer';
import { IntelligenceScorer } from '../services/intelligence-scorer';
import { RiskAssessor } from '../services/risk-assessor';
import { StubPriceProvider } from '../services/price-provider';
import { TransactionMeta, validateTransactionSignature, validateWalletAddress } from '../types/domain';

describe('API Server', () => {
  let app: any;
  let server: APIServer;
  let mockTransactionRetriever: any;

  beforeEach(() => {
    // Mock transaction retriever
    mockTransactionRetriever = {
      getWalletTransactionsMeta: vi.fn(),
      getTransaction: vi.fn(),
    };

    // Create server with mocked services
    server = new APIServer(
      3000,
      mockTransactionRetriever,
      new BehaviorAnalyzer(),
      new IntelligenceScorer(),
      new RiskAssessor(),
      new StubPriceProvider()
    );

    app = server.getApp();
  });

  describe('GET /api/v1/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.service).toBe('PROJECT-X');
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
