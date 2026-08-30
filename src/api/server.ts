import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { validateWalletAddress, validateTransactionSignature } from '../types/domain';
import { ValidationError, RpcError } from '../types/errors';
import { TransactionRetriever } from '../services/transaction-retriever';
import { BehaviorAnalyzer } from '../services/behavior-analyzer';
import { IntelligenceScorer } from '../services/intelligence-scorer';
import { RiskAssessor } from '../services/risk-assessor';
import { PriceProvider } from '../services/price-provider';
import { DexRegistry } from '../services/dex-registry';
import { ResearchAgent, WalletIntelligenceAgent } from '../agents/core_agents';
import { EvidenceEngine } from '../agents/evidence-engine';
import { AgentRouter, AGENT_INTENTS, AgentIntent } from '../agents/agent-router';

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
  private dexRegistry: DexRegistry;
  private evidenceEngine: EvidenceEngine;
  private researchAgent: ResearchAgent;
  private walletAgent: WalletIntelligenceAgent;
  private agentRouter: AgentRouter;

  constructor(
    port: number,
    transactionRetriever: TransactionRetriever,
    behaviorAnalyzer: BehaviorAnalyzer,
    intelligenceScorer: IntelligenceScorer,
    riskAssessor: RiskAssessor,
    priceProvider: PriceProvider,
    dexRegistry: DexRegistry,
    evidenceEngine: EvidenceEngine,
    researchAgent: ResearchAgent,
    walletAgent: WalletIntelligenceAgent,
    agentRouter: AgentRouter
  ) {
    this.port = port;
    this.app = express();
    this.transactionRetriever = transactionRetriever;
    this.behaviorAnalyzer = behaviorAnalyzer;
    this.intelligenceScorer = intelligenceScorer;
    this.riskAssessor = riskAssessor;
    this.priceProvider = priceProvider;
    this.dexRegistry = dexRegistry;
    this.evidenceEngine = evidenceEngine;
    this.researchAgent = researchAgent;
    this.walletAgent = walletAgent;
    this.agentRouter = agentRouter;

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    // Secure HTTP headers (hides X-Powered-By, sets CSP/HSTS/etc. defaults)
    this.app.use(helmet());

    // CORS - allowlist of exact origins, comma-separated in CORS_ORIGIN.
    // NOTE: CORS is a browser-enforced mechanism only - it stops a script
    // running on someone else's web page from reading the response, but it
    // does NOT stop curl/server-to-server/scraper access (those requests
    // carry no Origin header at all). apiKeyAuth below is what actually
    // gates access to the data.
    const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    this.app.use(
      cors({
        origin: (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(null, false);
          }
        },
        credentials: false,
        methods: ['GET', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'X-API-Key'],
      })
    );

    // Rate limiting - mitigates scraping/abuse of the public read API.
    // A stricter per-route limit is applied to RPC-heavy endpoints in setupRoutes().
    this.app.use(
      rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        limit: 60, // 60 requests per IP per window
        standardHeaders: true,
        legacyHeaders: false,
        message: {
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests, please try again later.',
          },
        },
      })
    );

    // JSON parsing
    this.app.use(express.json({ limit: '1mb' }));

    // Request logging
    this.app.use((req: Request, _res: Response, next: NextFunction) => {
      console.log(`${req.method} ${req.path}`);
      next();
    });

    // API key authentication - opt-in via API_KEYS (comma-separated).
    // Left unset, the API stays open (dev-friendly default); set it in
    // production to require a valid X-API-Key header on every route
    // except the health check.
    this.app.use(this.apiKeyAuth);
  }

  /**
   * API key authentication middleware.
   * No-ops (open access) when API_KEYS is not configured.
   */
  private apiKeyAuth = (req: Request, res: Response, next: NextFunction): void => {
    if (req.path === '/api/v1/health') {
      next();
      return;
    }

    const configuredKeys = (process.env.API_KEYS || '')
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    if (configuredKeys.length === 0) {
      next();
      return;
    }

    const providedKey = req.header('x-api-key');

    if (!providedKey || !configuredKeys.includes(providedKey)) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid API key. Provide a valid X-API-Key header.',
        },
      } as ErrorResponse);
      return;
    }

    next();
  };

  /**
   * Stricter rate limit for endpoints that fetch/parse RPC data
   * (each request can trigger many upstream Solana RPC calls).
   */
  private heavyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 20, // 20 requests per IP per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests to this endpoint, please try again later.',
      },
    },
  });

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/api/v1/health', this.handleHealth.bind(this));

    // Wallet endpoints - RPC-heavy ones carry an extra, stricter rate limit
    this.app.get('/api/v1/wallet/:address/transactions', this.heavyLimiter, this.handleWalletTransactions.bind(this));
    this.app.get('/api/v1/wallet/:address/tokens', this.handleWalletTokens.bind(this));
    this.app.get('/api/v1/wallet/:address/behavior', this.heavyLimiter, this.handleWalletBehavior.bind(this));
    this.app.get('/api/v1/wallet/:address/intelligence', this.heavyLimiter, this.handleWalletIntelligence.bind(this));
    this.app.get('/api/v1/wallet/:address/risk', this.heavyLimiter, this.handleWalletRisk.bind(this));
    this.app.get('/api/v1/wallet/:address/analysis', this.heavyLimiter, this.handleWalletAnalysis.bind(this));
    // Evidence does one extra RPC round-trip per transaction (see EvidenceEngine) - heaviest route in the API.
    this.app.get('/api/v1/wallet/:address/evidence', this.heavyLimiter, this.handleWalletEvidence.bind(this));
    this.app.get('/api/v1/wallet/:address/research', this.heavyLimiter, this.handleWalletResearch.bind(this));

    // Transaction endpoint
    this.app.get('/api/v1/transaction/:signature', this.heavyLimiter, this.handleTransaction.bind(this));

    // Protocols - lists the DexRegistry's registered adapters (currently
    // none - see CLAUDE.md's "DEX/program identification is honest about
    // confidence" invariant. Returns an empty array rather than a
    // hardcoded protocol list.)
    this.app.get('/api/v1/protocols', this.handleProtocols.bind(this));

    // Agent Router - single entry point for MCP-style clients that don't
    // want to hardcode 5 different endpoints. Deterministic dispatch only
    // (no NLP/intent guessing) - see src/agents/agent-router.ts.
    this.app.get('/api/v1/agents/:intent', this.heavyLimiter, this.handleAgentRouter.bind(this));

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
      service: 'FactLedger',
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
   * Handle wallet tokens - real token balances via WalletIntelligenceAgent
   * (which reads SolanaRpcClient.getTokenBalances()), not a placeholder.
   */
  private async handleWalletTokens(req: Request, res: Response): Promise<void> {
    try {
      const address = validateWalletAddress(req.params.address);

      const result = await this.walletAgent.analyzeWallet(address);

      res.json({
        wallet: address,
        tokens: result.data?.tokenBalances ?? [],
        evidenceStatus: result.evidenceStatus,
        disclaimer:
          result.data === null
            ? `Token balances unavailable: ${result.justification}`
            : 'Token balances read directly from Solana RPC (SPL token accounts only).',
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
   * Handle wallet evidence report
   */
  private async handleWalletEvidence(req: Request, res: Response): Promise<void> {
    try {
      const address = validateWalletAddress(req.params.address);
      // Lower default/cap than the other routes: this one does one extra
      // RPC round-trip per transaction (see EvidenceEngine).
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);

      const result = await this.evidenceEngine.buildWalletEvidence(address, limit);

      res.json({
        wallet: address,
        ...result,
        disclaimer:
          'Evidence is derived from observable blockchain transactions only. Each entry\'s confidencePercent reflects a fixed mapping (confirmed=100, candidate=50, unknown=0), never an invented value. Not financial advice.',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle wallet research report (synthesizes wallet + risk agent output)
   */
  private async handleWalletResearch(req: Request, res: Response): Promise<void> {
    try {
      const address = validateWalletAddress(req.params.address);
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);

      const result = await this.researchAgent.generateReport(address, limit);

      res.json({
        wallet: address,
        ...result,
        disclaimer:
          'This report is synthesized only from real, deterministic agent outputs. Not financial advice.',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle protocols list
   */
  private handleProtocols(_req: Request, res: Response): void {
    const programIds = this.dexRegistry.getKnownProgramIds();

    res.json({
      protocols: programIds,
      disclaimer:
        programIds.length === 0
          ? 'No DEX protocol adapters are currently registered in this deployment - see CLAUDE.md. This is an empty list, not an error, so downstream callers do not mistake it for a fabricated one.'
          : 'Protocol identification reflects only adapters registered in DexRegistry.',
    });
  }

  /**
   * Handle agent router dispatch - GET /api/v1/agents/:intent
   * ?address=...&signature=...&topic=...&limit=...
   * Deterministic dispatch only - see src/agents/agent-router.ts.
   */
  private async handleAgentRouter(req: Request, res: Response): Promise<void> {
    const intentParam = req.params.intent;

    if (!AGENT_INTENTS.includes(intentParam as AgentIntent)) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: `Unknown intent '${intentParam}'. Valid intents: ${AGENT_INTENTS.join(', ')}.`,
        },
      } as ErrorResponse);
      return;
    }

    const limitRaw = parseInt(req.query.limit as string);
    const result = await this.agentRouter.route(intentParam as AgentIntent, {
      address: typeof req.query.address === 'string' ? req.query.address : undefined,
      signature: typeof req.query.signature === 'string' ? req.query.signature : undefined,
      topic: typeof req.query.topic === 'string' ? req.query.topic : undefined,
      limit: Number.isFinite(limitRaw) ? Math.min(limitRaw, 1000) : undefined,
    });

    res.json({
      intent: intentParam,
      ...result,
      disclaimer: 'Routed deterministically to one agent based on the intent parameter - not a financial advice, and not an AI-guessed interpretation of a free-form question.',
    });
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
      console.log(`FactLedger API listening on port ${this.port}`);
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
