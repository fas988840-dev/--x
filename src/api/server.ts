import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger.js';
import {
  validateWalletAddress,
  validateTransactionSignature,
  validateTokenMint,
  WalletAddress,
} from '../types/domain.js';
import { ValidationError, RpcError } from '../types/errors.js';
import { TransactionRetriever } from '../services/transaction-retriever.js';
import { BehaviorAnalyzer } from '../services/behavior-analyzer.js';
import { IntelligenceScorer } from '../services/intelligence-scorer.js';
import { RiskAssessor } from '../services/risk-assessor.js';
import { PriceProvider } from '../services/price-provider.js';
import { DexRegistry } from '../services/dex-registry.js';
import { ResearchAgent, WalletIntelligenceAgent, AlertAgent, ExplanationAgent } from '../agents/core_agents.js';
import { EvidenceEngine } from '../agents/evidence-engine.js';
import { LiveAlertWatcher } from '../services/live-alert-watcher.js';
import { TokenSecurityVerifier } from '../services/token-security-verifier.js';
import { AgentRouter, AGENT_INTENTS, AgentIntent } from '../agents/agent-router.js';

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
  private alertAgent: AlertAgent;
  private explanationAgent: ExplanationAgent;
  private liveAlertWatcher: LiveAlertWatcher;
  private tokenSecurityVerifier: TokenSecurityVerifier;

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
    agentRouter: AgentRouter,
    alertAgent: AlertAgent,
    explanationAgent: ExplanationAgent,
    liveAlertWatcher: LiveAlertWatcher,
    tokenSecurityVerifier: TokenSecurityVerifier
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
    this.alertAgent = alertAgent;
    this.explanationAgent = explanationAgent;
    this.liveAlertWatcher = liveAlertWatcher;
    this.tokenSecurityVerifier = tokenSecurityVerifier;
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
    // Render, Fly and Railway all put the app behind their own proxy, so the
    // socket address is the proxy's, not the caller's. Without this,
    // express-rate-limit buckets every request under one IP and the 60/15min
    // limit becomes global rather than per-client: one busy caller would lock
    // out everyone, health checks included. 1 = trust exactly one hop, which
    // is what these platforms put in front of us - `true` would trust any
    // X-Forwarded-For a client sends and make the limit trivially bypassable.
    this.app.set('trust proxy', 1);

    this.app.use(helmet());

    // Never let a response be cached. Every route here answers from live
    // chain state, so a stored copy is wrong the moment it is stored — and a
    // browser applying heuristic caching (which it does when no Cache-Control
    // is present) will keep serving a stale body for the same URL long after
    // the server has changed. That is not hypothetical: it made a working
    // deployment look like a dead one, because the browser kept replaying a
    // 404 captured before the service was live.
    //
    // The SSE stream's own writeHead() overrides Cache-Control with its own
    // value below; Pragma: no-cache from this middleware still goes out on
    // that response too (writeHead only replaces headers it names), which
    // is harmless here since it also just discourages caching.
    this.app.use((_req: Request, res: Response, next: NextFunction) => {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.set('Pragma', 'no-cache');
      next();
    });

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
        // Liveness endpoints must never be throttled. A platform health check
        // that gets a 429 reads as the service being down, and the platform
        // stops routing traffic to a server that is working - the same failure
        // mode as the health route depending on CoinGecko, by another route.
        skip: (req) => req.path === '/' || req.path === '/api/v1/health',
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
      logger.info(`${req.method} ${req.path}`);
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
    if (req.path === '/' || req.path === '/api/v1/health') {
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
   * Wraps an async route handler so a rejected promise reaches
   * setupErrorHandling() via next(error) instead of becoming an unhandled
   * promise rejection. Express 4 (this project's version) does NOT do
   * this automatically for async handlers - without this wrapper, every
   * `throw` inside a handler below (including validateWalletAddress()
   * rejecting bad input, on essentially every route) would silently hang
   * the request and crash the process on Node's default
   * unhandled-rejection behavior instead of returning a 400/500. This was
   * a real, pre-existing gap - every async handler is wrapped below.
   */
  private asyncHandler(handler: (req: Request, res: Response) => Promise<void>) {
    return (req: Request, res: Response, next: NextFunction): void => {
      handler(req, res).catch(next);
    };
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/', this.handleIndex.bind(this));
    this.app.get('/api/v1/health', this.asyncHandler(this.handleHealth.bind(this)));

    // Wallet endpoints - RPC-heavy ones carry an extra, stricter rate limit
    this.app.get('/api/v1/wallet/:address/transactions', this.heavyLimiter, this.asyncHandler(this.handleWalletTransactions.bind(this)));
    this.app.get('/api/v1/wallet/:address/tokens', this.asyncHandler(this.handleWalletTokens.bind(this)));
    this.app.get('/api/v1/wallet/:address/behavior', this.heavyLimiter, this.asyncHandler(this.handleWalletBehavior.bind(this)));
    this.app.get('/api/v1/wallet/:address/intelligence', this.heavyLimiter, this.asyncHandler(this.handleWalletIntelligence.bind(this)));
    this.app.get('/api/v1/wallet/:address/risk', this.heavyLimiter, this.asyncHandler(this.handleWalletRisk.bind(this)));
    this.app.get('/api/v1/wallet/:address/analysis', this.heavyLimiter, this.asyncHandler(this.handleWalletAnalysis.bind(this)));
    // Evidence does one extra RPC round-trip per transaction (see EvidenceEngine) - heaviest route in the API.
    this.app.get('/api/v1/wallet/:address/evidence', this.heavyLimiter, this.asyncHandler(this.handleWalletEvidence.bind(this)));
    this.app.get('/api/v1/wallet/:address/research', this.heavyLimiter, this.asyncHandler(this.handleWalletResearch.bind(this)));
    this.app.get('/api/v1/wallet/:address/alerts', this.heavyLimiter, this.asyncHandler(this.handleWalletAlerts.bind(this)));
    // Calls the ChainGPT API on top of the usual RPC reads - the heaviest
    // per-request cost in the API alongside evidence, so it rides heavyLimiter too.
    this.app.get('/api/v1/wallet/:address/explanation', this.heavyLimiter, this.asyncHandler(this.handleWalletExplanation.bind(this)));
    // Live/streaming counterpart to /alerts - a long-lived Server-Sent
    // Events connection, not a single request/response. Still rides
    // heavyLimiter since opening it starts a standing RPC subscription.
    this.app.get('/api/v1/wallet/:address/alerts/stream', this.heavyLimiter, this.asyncHandler(this.handleWalletAlertsStream.bind(this)));

    // Transaction endpoint
    this.app.get('/api/v1/transaction/:signature', this.heavyLimiter, this.asyncHandler(this.handleTransaction.bind(this)));

    // Protocols - lists the DexRegistry's registered adapters (currently
    // none - see CLAUDE.md's "DEX/program identification is honest about
    // confidence" invariant. Returns an empty array rather than a
    // hardcoded protocol list.)
    this.app.get('/api/v1/token/:mint/security', this.heavyLimiter, this.asyncHandler(this.handleTokenSecurity.bind(this)));

    this.app.get('/api/v1/protocols', this.handleProtocols.bind(this));

    // Agent Router - single entry point for MCP-style clients that don't
    // want to hardcode 5 different endpoints. Deterministic dispatch only
    // (no NLP/intent guessing) - see src/agents/agent-router.ts.
    this.app.get('/api/v1/agents/:intent', this.heavyLimiter, this.asyncHandler(this.handleAgentRouter.bind(this)));

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
        logger.error('Error:', err);

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
        return res.status(500).json({
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
  /**
   * Liveness check. Answers one question: is this process serving?
   *
   * It used to await priceProvider.isHealthy(), an outbound call to
   * CoinGecko, and return 503 when that failed. A platform health check
   * pointed here (render.yaml, fly.toml) would then mark the service
   * unhealthy because a third party was rate-limiting us, and stop routing
   * traffic to a server that was working perfectly well. A liveness probe
   * must not depend on someone else's uptime.
   *
   * The price provider's state is still reported, as a field rather than as
   * the verdict, so a caller can see a degraded dependency without the
   * platform tearing the service down over it. It is also given a short
   * timeout so a hanging dependency cannot hang the probe.
   */
  private async handleHealth(_req: Request, res: Response): Promise<void> {
    let priceProviderHealthy: boolean | null = null;
    try {
      priceProviderHealthy = await Promise.race([
        this.priceProvider.isHealthy(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
      ]);
    } catch {
      priceProviderHealthy = false;
    }

    const response: HealthResponse & { dependencies: Record<string, string> } = {
      status: 'ok',
      service: 'FactLedger',
      version: '0.1.0',
      dependencies: {
        priceProvider:
          priceProviderHealthy === null
            ? 'unknown'
            : priceProviderHealthy
              ? 'ok'
              : 'degraded',
      },
    };

    res.status(200).json(response);
  }

  /**
   * Service index at the root.
   *
   * Without this, GET / fell through to the 404 handler, so anyone pasting
   * the bare deployment URL — which is what a reviewer given a link actually
   * does — saw "not found" and reasonably concluded the service was broken.
   * Public, like /api/v1/health, since there is nothing to protect here.
   */
  private handleIndex(_req: Request, res: Response): void {
    res.json({
      service: 'FactLedger',
      version: '0.1.0',
      description:
        'Read-only Solana wallet intelligence. Every value is either verified ' +
        'on-chain or returned as null — never estimated.',
      repository: 'https://github.com/fas988840-dev/--x',
      documentation: 'https://github.com/fas988840-dev/--x#api-endpoints',
      health: '/api/v1/health',
      authentication:
        'Routes other than / and /api/v1/health require an X-API-Key header ' +
        'when the server is started with API_KEYS set.',
      endpoints: {
        wallet: [
          '/api/v1/wallet/:address/transactions',
          '/api/v1/wallet/:address/tokens',
          '/api/v1/wallet/:address/behavior',
          '/api/v1/wallet/:address/intelligence',
          '/api/v1/wallet/:address/risk',
          '/api/v1/wallet/:address/analysis',
          '/api/v1/wallet/:address/evidence',
          '/api/v1/wallet/:address/research',
          '/api/v1/wallet/:address/alerts',
          '/api/v1/wallet/:address/alerts/stream',
          '/api/v1/wallet/:address/explanation',
        ],
        token: ['/api/v1/token/:mint/security'],
        transaction: ['/api/v1/transaction/:signature'],
        other: ['/api/v1/protocols', '/api/v1/agents/:intent'],
      },
      disclaimer: 'Not financial advice.',
    });
  }

  /**
   * Handle wallet transactions
   */
  private async handleWalletTransactions(req: Request, res: Response): Promise<void> {
    // No try/catch here: any throw (validateWalletAddress on bad input, or
    // an RPC failure) propagates to asyncHandler's .catch(next), which
    // routes it to the centralized error handler - same for every handler
    // below that used to wrap itself in a try/catch that only rethrew.
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
  }

  /**
   * Handle wallet tokens - real token balances via WalletIntelligenceAgent
   * (which reads SolanaRpcClient.getTokenBalances()), not a placeholder.
   */
  private async handleWalletTokens(req: Request, res: Response): Promise<void> {
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
  }

  /**
   * Handle wallet behavior
   */
  private async handleWalletBehavior(req: Request, res: Response): Promise<void> {
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
  }

  /**
   * Handle wallet intelligence
   */
  private async handleWalletIntelligence(req: Request, res: Response): Promise<void> {
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
  }

  /**
   * Handle wallet risk
   */
  private async handleWalletRisk(req: Request, res: Response): Promise<void> {
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
  }

  /**
   * Handle wallet full analysis
   */
  private async handleWalletAnalysis(req: Request, res: Response): Promise<void> {
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
  }

  /**
   * Handle wallet evidence report
   */
  private async handleWalletEvidence(req: Request, res: Response): Promise<void> {
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
  }

  /**
   * Handle wallet research report (synthesizes wallet + risk agent output)
   */
  private async handleWalletResearch(req: Request, res: Response): Promise<void> {
    const address = validateWalletAddress(req.params.address);
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);

    const result = await this.researchAgent.generateReport(address, limit);

    res.json({
      wallet: address,
      ...result,
      disclaimer:
        'This report is synthesized only from real, deterministic agent outputs. Not financial advice.',
    });
  }

  /**
   * Handle wallet alerts (deterministic evaluation, not a live watcher - see AlertEngine)
   */
  private async handleWalletAlerts(req: Request, res: Response): Promise<void> {
    const address = validateWalletAddress(req.params.address);
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);

    const result = await this.alertAgent.evaluateWallet(address, limit);

    res.json({
      wallet: address,
      ...result,
      disclaimer:
        'Alerts are evaluated once, from the transactions examined in this request - not a live/streaming watch. Each alert cites the real numbers that triggered it. Not financial advice.',
    });
  }

  /**
   * Handle wallet explanation - a ChainGPT-generated plain-language
   * rephrasing of already-real wallet/risk data (see ExplanationAgent).
   * keyActivities/riskAssessment/patterns stay real even if ChainGPT is
   * unreachable; only `summary` (and `summarySource`) reflect that.
   */
  private async handleWalletExplanation(req: Request, res: Response): Promise<void> {
    const address = validateWalletAddress(req.params.address);
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);

    const result = await this.explanationAgent.explainWallet(address, limit);

    res.json({
      wallet: address,
      ...result,
      disclaimer:
        'summary may be ChainGPT-generated (see data.summarySource) but is constrained to rephrasing real, deterministic pipeline output - it is never an independent source of facts. Not financial advice.',
    });
  }

  /**
   * Handle live wallet alerts - Server-Sent Events, the live/streaming
   * counterpart to /alerts (see LiveAlertWatcher). Not a JSON
   * request/response: once the stream opens, every event written is a
   * real Alert from AlertEngine (never a guess), sent once immediately
   * and again on each new on-chain transaction until the client
   * disconnects.
   */
  private async handleWalletAlertsStream(req: Request, res: Response): Promise<void> {
    // No try/catch: an invalid address throws before any response is
    // written, and propagates to asyncHandler's .catch(next) same as
    // every other route - no need to catch and rethrow it here.
    const address: WalletAddress = validateWalletAddress(req.params.address);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // disable proxy buffering (e.g. nginx) so events flush immediately
    });
    res.write(
      `: connected - live alert stream for ${address}. Evaluated once immediately, then again on each new on-chain transaction. Every event is a real, evidence-cited Alert (see AlertEngine) - never a guess.\n\n`
    );

    try {
      const subscription = this.liveAlertWatcher.watch(address, (alert) => {
        res.write(`data: ${JSON.stringify(alert)}\n\n`);
      });
      req.on('close', () => {
        void subscription.stop();
      });
    } catch (error) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: error instanceof Error ? error.message : String(error) })}\n\n`);
      res.end();
    }
  }

  /**
   * Handle protocols list
   */
  /**
   * Token mint security check - reports what the mint account states on-chain.
   *
   * Deliberately never answers "safe". Renounced authorities do not rule out a
   * rug: the deployer may hold most of the supply, liquidity may be unlocked, a
   * Token-2022 hook may block selling. The report names what it checked and
   * what it did not, and a caller wanting to read that as safe has to make that
   * leap in its own code. See token-security-verifier.ts.
   */
  private async handleTokenSecurity(req: Request, res: Response): Promise<void> {
    const mint = validateTokenMint(req.params.mint);
    const report = await this.tokenSecurityVerifier.inspectToken(mint);
    res.json(report);
  }

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
  }

  /**
   * Start server
   */
  public start(): void {
    this.app.listen(this.port, () => {
      logger.info(`FactLedger API listening on port ${this.port}`);
      logger.info(`Health check: http://localhost:${this.port}/api/v1/health`);
    });
  }

  /**
   * Get Express app (for testing)
   */
  public getApp(): Express {
    return this.app;
  }
}
