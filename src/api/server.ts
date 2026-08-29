import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { validateWalletAddress, validateTransactionSignature } from '../types/domain';
import { ValidationError, RpcError } from '../types/errors';
import { TransactionRetriever } from './transaction-retriever';
import { BehaviorAnalyzer } from './behavior-analyzer';
import { IntelligenceScorer } from './intelligence-scorer';
import { RiskAssessor } from './risk-assessor';
import { PriceProvider } from './price-provider';

/**
 * API Error Response
 */
interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

/**
 * Health Response
 */
interface HealthResponse {
  status: 'ok' | 'degraded';
  service: string;
  version: string;
}

/**
 * Wallet Analysis Response
 */
interface WalletAnalysisResponse {
  wallet: string;
  observableData: {
    transactionCount: number;
    successfulTransactions: number;
    failedTransactions: number;
    uniqueTokens: number;
    uniquePrograms: number;
  };
  behavior: {
    failureRate: number;
    swapCount: number;
    averageTransactionInterval: number;
    peakActivityHour: number;
    totalVolumeUSD: number | null;
  };
  intelligence: {
    score: number;
    components: {
      activity: number;
      sophistication: number;
      consistency: number;
      efficiency: number;
    };
    factors: string[];
  };
  risk: {
    score: number;
    level: 'low' | 'medium' | 'high';
    factors: {
      failureRateScore: number;
      frequencyScore: number;
      concentrationScore: number;
      volatilityScore: number;
      suspiciousPatternScore: number;
    };
    reasoning: string[];
  };
  disclaimer: string;
}

/**
 * API Server
 */
export class APIServer {
  private app: Express;
  private port: number;
  private transactionRetriever: TransactionRetriever;
  private behaviorAnalyzer: BehaviorAnalyzer;
  private intelligenceScorer: IntelligenceScorer;
  private riskAssessor: RiskAssessor;
  private priceProvider: PriceProvider;

  constructor(
    port: number,
    transactionRetriever: TransactionRetriever,
    behaviorAnalyzer: BehaviorAnalyzer,
    intelligenceScorer: IntelligenceScorer,
    riskAssessor: RiskAssessor,
    priceProvider: PriceProvider
  ) {
    this.port = port;
    this.app = express();
    this.transactionRetriever = transactionRetriever;
    this.behaviorAnalyzer = behaviorAnalyzer;
    this.intelligenceScorer = intelligenceScorer;
    this.riskAssessor = riskAssessor;
    this.priceProvider = priceProvider;

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    // CORS - safe by default
    this.app.use(
      cors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: false,
        methods: ['GET', 'OPTIONS'],
        allowedHeaders: ['Content-Type'],
      })
    );

    // JSON parsing
    this.app.use(express.json({ limit: '1mb' }));

    // Request logging
    this.app.use((req: Request, _res: Response, next: NextFunction) => {
      console.log(`${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/api/v1/health', this.handleHealth.bind(this));

    // Wallet endpoints
    this.app.get('/api/v1/wallet/:address/transactions', this.handleWalletTransactions.bind(this));
    this.app.get('/api/v1/wallet/:address/tokens', this.handleWalletTokens.bind(this));
    this.app.get('/api/v1/wallet/:address/behavior', this.handleWalletBehavior.bind(this));
    this.app.get('/api/v1/wallet/:address/intelligence', this.handleWalletIntelligence.bind(this));
    this.app.get('/api/v1/wallet/:address/risk', this.handleWalletRisk.bind(this));
    this.app.get('/api/v1/wallet/:address/analysis', this.handleWalletAnalysis.bind(this));

    // Transaction endpoint
    this.app.get('/api/v1/transaction/:signature', this.handleTransaction.bind(this));

    // 404 handler
    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Endpoint not found',
        },
      } as ErrorResponse);
    });
  }

  /**
   * Setup centralized error handling
   */
  private setupErrorHandling(): void {
    this.app.use(
      (
        err: Error | ValidationError | RpcError,
        _req: Request,
        res: Response,
        _next: NextFunction
      ) => {
        console.error('Error:', err);

        if (err instanceof ValidationError) {
          return res.status(400).json({
            error: {
              code: 'VALIDATION_ERROR',
              message: err.message,
            },
          } as ErrorResponse);
        }

        if (err instanceof RpcError) {
          return res.status(err.statusCode).json({
            error: {
              code: 'RPC_ERROR',
              message: err.message,
            },
          } as ErrorResponse);
        }

        // Generic error - never expose stack trace in production
        res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
          },
        } as ErrorResponse);
      }
    );
  }

  /**
   * Handle health check
   */
  private async handleHealth(req: Request, res: Response): Promise<void> {
    const healthy = await this.priceProvider.isHealthy();

    const response: HealthResponse = {
      status: healthy ? 'ok' : 'degraded',
      service: 'PROJECT-X',
      version: '0.1.0',
    };

    res.status(healthy ? 200 : 503).json(response);
  }

  /**
   * Handle wallet transactions
   */
  private async handleWalletTransactions(req: Request, res: Response): Promise<void> {
    try {
      const address = validateWalletAddress(req.params.address);
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);

      const transactions = await this.transactionRetriever.getWalletTransactionsMeta(address, limit);

      res.json({
        wallet: address,
        transactions: transactions.map((tx) => ({
          signature: tx.signature,
          slot: tx.slot,
          blockTime: tx.blockTime,
          status: tx.status,
          fee: tx.fee,
        })),
        count: transactions.length,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle wallet tokens
   */
  private async handleWalletTokens(req: Request, res: Response): Promise<void> {
    try {
      const address = validateWalletAddress(req.params.address);

      // This would require token balance retrieval from RPC
      // For now, return placeholder
      res.json({
        wallet: address,
        tokens: [],
        disclaimer: 'Token balance data requires additional RPC integration',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle wallet behavior
   */
  private async handleWalletBehavior(req: Request, res: Response): Promise<void> {
    try {
      const address = validateWalletAddress(req.params.address);
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);

      const transactions = await this.transactionRetriever.getWalletTransactionsMeta(address, limit);

      // Extract unique tokens and programs (stub - requires full instruction parsing)
      const uniqueTokens = new Set<string>();
      const uniquePrograms = new Set<string>();

      const behavior = this.behaviorAnalyzer.analyzeBehavior(transactions, [], uniqueTokens, uniquePrograms);

      res.json({
        wallet: address,
        behavior,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle wallet intelligence
   */
  private async handleWalletIntelligence(req: Request, res: Response): Promise<void> {
    try {
      const address = validateWalletAddress(req.params.address);
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);

      const transactions = await this.transactionRetriever.getWalletTransactionsMeta(address, limit);

      const uniqueTokens = new Set<string>();
      const uniquePrograms = new Set<string>();

      const behavior = this.behaviorAnalyzer.analyzeBehavior(transactions, [], uniqueTokens, uniquePrograms);
      const intelligence = this.intelligenceScorer.scoreIntelligence(behavior);

      res.json({
        wallet: address,
        intelligence,
        disclaimer: 'Intelligence score is derived from observable blockchain behavior only. Not financial advice.',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle wallet risk
   */
  private async handleWalletRisk(req: Request, res: Response): Promise<void> {
    try {
      const address = validateWalletAddress(req.params.address);
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);

      const transactions = await this.transactionRetriever.getWalletTransactionsMeta(address, limit);

      const uniqueTokens = new Set<string>();
      const uniquePrograms = new Set<string>();

      const behavior = this.behaviorAnalyzer.analyzeBehavior(transactions, [], uniqueTokens, uniquePrograms);
      const risk = this.riskAssessor.assessRisk(behavior);

      res.json({
        wallet: address,
        risk,
        disclaimer:
          'Risk assessment is derived from observable blockchain behavior only. This is not financial advice and should not be used for investment decisions.',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle wallet full analysis
   */
  private async handleWalletAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const address = validateWalletAddress(req.params.address);
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);

      const transactions = await this.transactionRetriever.getWalletTransactionsMeta(address, limit);

      const uniqueTokens = new Set<string>();
      const uniquePrograms = new Set<string>();

      const behavior = this.behaviorAnalyzer.analyzeBehavior(transactions, [], uniqueTokens, uniquePrograms);
      const intelligence = this.intelligenceScorer.scoreIntelligence(behavior);
      const risk = this.riskAssessor.assessRisk(behavior);

      const response: WalletAnalysisResponse = {
        wallet: address,
        observableData: {
          transactionCount: behavior.transactionCount,
          successfulTransactions: behavior.successTransactionCount,
          failedTransactions: behavior.failedTransactionCount,
          uniqueTokens: behavior.uniqueTokens,
          uniquePrograms: behavior.uniqueProgramsInteracted,
        },
        behavior: {
          failureRate: behavior.failureRate,
          swapCount: behavior.swapCount,
          averageTransactionInterval: behavior.averageTransactionIntervalSeconds,
          peakActivityHour: behavior.peakActivityHour,
          totalVolumeUSD: behavior.totalVolumeUSD,
        },
        intelligence: {
          score: intelligence.score,
          components: intelligence.components,
          factors: intelligence.factors,
        },
        risk: {
          score: risk.score,
          level: risk.level,
          factors: risk.factors,
          reasoning: risk.reasoning,
        },
        disclaimer:
          'This analysis is derived from observable blockchain behavior only. Intelligence and risk scores are not financial advice and should not be used for investment decisions.',
      };

      res.json(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle transaction
   */
  private async handleTransaction(req: Request, res: Response): Promise<void> {
    try {
      const signature = validateTransactionSignature(req.params.signature);
      const transaction = await this.transactionRetriever.getTransaction(signature);

      if (!transaction) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Transaction not found',
          },
        } as ErrorResponse);
        return;
      }

      res.json({
        signature,
        transaction: {
          slot: transaction.slot,
          blockTime: transaction.blockTime,
          status: transaction.status,
          fee: transaction.fee,
          logMessages: transaction.logMessages,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Start server
   */
  public start(): void {
    this.app.listen(this.port, () => {
      console.log(`PROJECT-X API listening on port ${this.port}`);
      console.log(`Health check: http://localhost:${this.port}/api/v1/health`);
    });
  }

  /**
   * Get Express app (for testing)
   */
  public getApp(): Express {
    return this.app;
  }
}
