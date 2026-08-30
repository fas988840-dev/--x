/**
 * Core "agents" - thin, honest facades over the existing deterministic
 * services (TransactionRetriever, BehaviorAnalyzer, RiskAssessor, ...).
 *
 * IMPORTANT: these are NOT autonomous/LLM agents. There is no free-form
 * generation and no invented data anywhere in this file. Every field
 * returned either:
 *   (a) comes directly from a real read against Solana RPC / the existing
 *       pipeline, in which case evidenceStatus is VERIFIED and
 *       confidenceScore reflects how directly-observed that fact is, or
 *   (b) is a capability this codebase does not implement yet (e.g. live
 *       market/event tracking), in which case evidenceStatus is UNKNOWN,
 *       data is null, and confidenceScore is 0 - never a guessed value.
 *
 * One exception, scoped narrowly: ExplanationAgent (below) does make one
 * model call, to ChainGPT - but only ever to rephrase facts this file
 * already computed deterministically, via a prompt that states those
 * facts explicitly and forbids adding anything else. It is not free-form
 * generation of new claims, and every other agent in this file still makes
 * zero model calls.
 *
 * This mirrors the "never fabricate blockchain data" invariant documented
 * in CLAUDE.md and enforced throughout src/services/.
 */

import {
  WalletAddress,
  TransactionSignature,
  validateWalletAddress,
  validateTransactionSignature,
  RiskScore,
  Alert,
  AIExplanation,
} from '../types/domain';
import { TransactionRetriever } from '../services/transaction-retriever';
import { SolanaRpcClient } from '../services/solana-rpc-client';
import { BehaviorAnalyzer } from '../services/behavior-analyzer';
import { RiskAssessor } from '../services/risk-assessor';
import { InstructionParser } from '../services/instruction-parser';
import { AlertEngine } from '../services/alert-engine';
import { ChainGptClient } from '../services/chaingpt-client';

export enum EvidenceStatus {
  VERIFIED = 'VERIFIED', // Directly read from chain / computed deterministically from chain data
  CANDIDATE = 'CANDIDATE', // Partially observed, not fully confirmed
  UNKNOWN = 'UNKNOWN', // Not available - never filled in with a guess
}

export interface AgentResponse<T> {
  agentId: string;
  timestamp: number;
  evidenceStatus: EvidenceStatus;
  confidenceScore: number; // 0.00 - 1.00. Always 0 when data is null.
  data: T | null;
  justification: string;
}

function unknownResponse<T>(agentId: string, justification: string): AgentResponse<T> {
  return {
    agentId,
    timestamp: Date.now(),
    evidenceStatus: EvidenceStatus.UNKNOWN,
    confidenceScore: 0,
    data: null,
    justification,
  };
}

// ---------------------------------------------------------------------------
// 1. Wallet Intelligence Agent
// ---------------------------------------------------------------------------

export interface WalletIntelligenceData {
  transactionCount: number;
  successfulTransactions: number;
  failedTransactions: number;
  solBalanceLamports: string;
  tokenBalances: Array<{ mint: string; amount: string; decimals: number }>;
  // DEX/protocol identification requires working DexRegistry adapters,
  // which are unimplemented placeholders in this codebase (see
  // src/services/dex-registry.ts) - always empty until that's real.
  knownProtocolsDetected: string[];
}

export class WalletIntelligenceAgent {
  constructor(
    private transactionRetriever: TransactionRetriever,
    private rpcClient: SolanaRpcClient
  ) {}

  async analyzeWallet(address: string, limit = 100): Promise<AgentResponse<WalletIntelligenceData>> {
    let validated: WalletAddress;
    try {
      validated = validateWalletAddress(address);
    } catch (error) {
      return unknownResponse<WalletIntelligenceData>('wallet_intel_v1', `Invalid wallet address: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      const [transactions, solBalance, tokenBalances] = await Promise.all([
        this.transactionRetriever.getWalletTransactionsMeta(validated, limit),
        this.rpcClient.getSolBalance(validated),
        this.rpcClient.getTokenBalances(validated),
      ]);

      const data: WalletIntelligenceData = {
        transactionCount: transactions.length,
        successfulTransactions: transactions.filter((tx) => tx.status === 'success').length,
        failedTransactions: transactions.filter((tx) => tx.status === 'failed').length,
        solBalanceLamports: String(solBalance),
        tokenBalances,
        knownProtocolsDetected: [],
      };

      return {
        agentId: 'wallet_intel_v1',
        timestamp: Date.now(),
        evidenceStatus: EvidenceStatus.VERIFIED,
        confidenceScore: 1,
        data,
        justification: `Read directly from Solana RPC: ${transactions.length} transactions, SOL balance, and ${tokenBalances.length} token account(s). Protocol/DEX identification not yet implemented, so knownProtocolsDetected is always empty rather than guessed.`,
      };
    } catch (error) {
      return unknownResponse<WalletIntelligenceData>('wallet_intel_v1', `RPC read failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Transaction Intelligence Agent
// ---------------------------------------------------------------------------

export interface TransactionIntelligenceData {
  status: 'success' | 'failed' | 'unknown';
  fee: string;
  blockTime: number | null;
  instructions: Array<{
    programId: string;
    programName: string;
    // Honest per-instruction confidence, matching ParsedInstructionStatus:
    // confirmed = known adapter decoded it, candidate = looks like a swap
    // but unverified, unknown = no adapter registered for this program.
    status: 'confirmed' | 'candidate' | 'unknown';
  }>;
}

export class TransactionIntelligenceAgent {
  constructor(
    private transactionRetriever: TransactionRetriever,
    private rpcClient: SolanaRpcClient,
    private instructionParser: InstructionParser
  ) {}

  async parseTx(txHash: string): Promise<AgentResponse<TransactionIntelligenceData>> {
    let signature: TransactionSignature;
    try {
      signature = validateTransactionSignature(txHash);
    } catch (error) {
      return unknownResponse<TransactionIntelligenceData>('tx_intel_v1', `Invalid transaction signature: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      const [meta, rawTx] = await Promise.all([
        this.transactionRetriever.getTransaction(signature),
        this.rpcClient.getTransaction(signature),
      ]);

      if (!meta || !rawTx) {
        return unknownResponse<TransactionIntelligenceData>('tx_intel_v1', 'Transaction not found on-chain.');
      }

      const instructions = this.transactionRetriever.extractInstructions(rawTx);
      const parsed = this.instructionParser.parseInstructions(instructions);

      const data: TransactionIntelligenceData = {
        status: meta.status,
        fee: meta.fee,
        blockTime: meta.blockTime,
        instructions: parsed.map((p) => ({
          programId: p.programId,
          programName: p.programName,
          status: p.status,
        })),
      };

      return {
        agentId: 'tx_intel_v1',
        timestamp: Date.now(),
        evidenceStatus: EvidenceStatus.VERIFIED,
        confidenceScore: 1,
        data,
        justification: `Transaction status/fee read directly from chain; ${parsed.length} instruction(s) classified via DexRegistry (each carries its own honest confirmed/candidate/unknown status - not collapsed into one number).`,
      };
    } catch (error) {
      return unknownResponse<TransactionIntelligenceData>('tx_intel_v1', `RPC read failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Market/Event Agent
// ---------------------------------------------------------------------------

export interface MarketEventData {
  alerts: string[];
}

/**
 * This codebase has no live event pipeline (no Geyser plugin, no
 * WebSocket subscription, no alert engine - the Alert type in domain.ts
 * is defined but not wired to anything). Returning fabricated "alerts"
 * would violate the no-fabrication invariant, so this agent always and
 * only reports UNKNOWN until that infrastructure genuinely exists.
 */
export class MarketEventAgent {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async trackEvents(_topic: string): Promise<AgentResponse<MarketEventData>> {
    return unknownResponse<MarketEventData>(
      'market_event_v1',
      'Live market/event tracking is not implemented in this codebase (no Geyser plugin or WebSocket subscription exists). Returning UNKNOWN rather than inventing an alert.'
    );
  }
}

// ---------------------------------------------------------------------------
// 4. Risk Agent
// ---------------------------------------------------------------------------

export class RiskAgent {
  constructor(
    private transactionRetriever: TransactionRetriever,
    private behaviorAnalyzer: BehaviorAnalyzer,
    private riskAssessor: RiskAssessor
  ) {}

  async evaluateRisk(address: string, limit = 100): Promise<AgentResponse<RiskScore>> {
    let validated: WalletAddress;
    try {
      validated = validateWalletAddress(address);
    } catch (error) {
      return unknownResponse<RiskScore>('risk_assessment_v1', `Invalid wallet address: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      const transactions = await this.transactionRetriever.getWalletTransactionsMeta(validated, limit);
      // Matches the same call shape as APIServer.handleWalletRisk() - swap
      // detection and program/token sets are not populated yet (see
      // BehaviorAnalyzer's own no-fabrication notes).
      const behavior = this.behaviorAnalyzer.analyzeBehavior(transactions, [], new Set(), new Set());
      const risk = this.riskAssessor.assessRisk(behavior);

      return {
        agentId: 'risk_assessment_v1',
        timestamp: Date.now(),
        evidenceStatus: EvidenceStatus.VERIFIED,
        confidenceScore: 1,
        data: risk,
        justification: `Computed deterministically from ${transactions.length} real transaction(s) via the existing RiskAssessor - reasoning factors included in risk.reasoning.`,
      };
    } catch (error) {
      return unknownResponse<RiskScore>('risk_assessment_v1', `RPC read failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// ---------------------------------------------------------------------------
// 5. Research Agent
// ---------------------------------------------------------------------------

export interface ResearchReportData {
  summary: string;
  auditTrail: string[]; // Real signatures/data points the summary is based on, never placeholders
}

export class ResearchAgent {
  constructor(
    private walletAgent: WalletIntelligenceAgent,
    private riskAgent: RiskAgent
  ) {}

  async generateReport(address: string, limit = 100): Promise<AgentResponse<ResearchReportData>> {
    const [walletResult, riskResult] = await Promise.all([
      this.walletAgent.analyzeWallet(address, limit),
      this.riskAgent.evaluateRisk(address, limit),
    ]);

    // If either sub-agent couldn't produce real data, say so plainly
    // instead of synthesizing a confident-sounding report around a gap.
    if (walletResult.data === null || riskResult.data === null) {
      return unknownResponse<ResearchReportData>(
        'research_synth_v1',
        `Cannot synthesize a report: ${walletResult.data === null ? walletResult.justification : ''} ${riskResult.data === null ? riskResult.justification : ''}`.trim()
      );
    }

    const w = walletResult.data;
    const r = riskResult.data;
    const summary = [
      `${w.transactionCount} transaction(s) observed (${w.successfulTransactions} successful, ${w.failedTransactions} failed).`,
      `Risk score ${r.score}/100 (${r.level}).`,
      r.reasoning.length > 0 ? `Reasoning: ${r.reasoning.join('; ')}.` : 'No specific risk factors triggered.',
    ].join(' ');

    return {
      agentId: 'research_synth_v1',
      timestamp: Date.now(),
      evidenceStatus: EvidenceStatus.VERIFIED,
      confidenceScore: Math.min(walletResult.confidenceScore, riskResult.confidenceScore),
      data: {
        summary,
        auditTrail: [walletResult.agentId, riskResult.agentId],
      },
      justification: 'Synthesized from WalletIntelligenceAgent and RiskAgent outputs only - no field here was generated independently of those two real, deterministic results.',
    };
  }
}

// ---------------------------------------------------------------------------
// 6. Alert Agent
// ---------------------------------------------------------------------------

export interface AlertAgentData {
  alerts: Alert[];
}

/**
 * Evaluates a wallet's real behavior/risk data (via AlertEngine) for
 * deterministic alert conditions. NOT a live/streaming watcher - see
 * AlertEngine's own doc comment and MarketEventAgent above for that
 * distinction.
 */
export class AlertAgent {
  constructor(
    private transactionRetriever: TransactionRetriever,
    private behaviorAnalyzer: BehaviorAnalyzer,
    private riskAssessor: RiskAssessor,
    private alertEngine: AlertEngine
  ) {}

  async evaluateWallet(address: string, limit = 100): Promise<AgentResponse<AlertAgentData>> {
    let validated: WalletAddress;
    try {
      validated = validateWalletAddress(address);
    } catch (error) {
      return unknownResponse<AlertAgentData>('alert_agent_v1', `Invalid wallet address: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      const transactions = await this.transactionRetriever.getWalletTransactionsMeta(validated, limit);
      const behavior = this.behaviorAnalyzer.analyzeBehavior(transactions, [], new Set(), new Set());
      const risk = this.riskAssessor.assessRisk(behavior);
      const alerts = this.alertEngine.evaluate(validated, behavior, risk);

      return {
        agentId: 'alert_agent_v1',
        timestamp: Date.now(),
        evidenceStatus: EvidenceStatus.VERIFIED,
        confidenceScore: 1,
        data: { alerts },
        justification: `Evaluated ${transactions.length} real transaction(s) against fixed, documented alert thresholds; ${alerts.length} alert(s) triggered, each citing the real numbers behind it.`,
      };
    } catch (error) {
      return unknownResponse<AlertAgentData>('alert_agent_v1', `RPC read failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// ---------------------------------------------------------------------------
// 7. Explanation Agent (ChainGPT integration)
// ---------------------------------------------------------------------------

/**
 * Turns already-computed, deterministic wallet + risk data into an
 * AIExplanation. ChainGPT (see src/services/chaingpt-client.ts) is used
 * for exactly one thing here: rephrasing facts this agent already knows
 * into plain language, via a prompt that states those facts explicitly
 * and instructs the model not to add anything beyond them.
 *
 * `keyActivities`, `riskAssessment`, and `patterns` are ALWAYS built from
 * real WalletIntelligenceAgent/RiskAgent output directly - never from the
 * LLM - so a ChainGPT outage never removes real information, only the
 * paraphrased `summary` sentence. When ChainGPT is unavailable (no API
 * key, network failure, unrecognized response), `summary` falls back to
 * the same deterministic sentence ResearchAgent produces, and
 * `summarySource` records which path was used - never silently presented
 * as AI-authored when it wasn't.
 */
export class ExplanationAgent {
  constructor(
    private walletAgent: WalletIntelligenceAgent,
    private riskAgent: RiskAgent,
    private chainGptClient: ChainGptClient
  ) {}

  async explainWallet(address: string, limit = 100): Promise<AgentResponse<AIExplanation>> {
    const [walletResult, riskResult] = await Promise.all([
      this.walletAgent.analyzeWallet(address, limit),
      this.riskAgent.evaluateRisk(address, limit),
    ]);

    if (walletResult.data === null || riskResult.data === null) {
      return unknownResponse<AIExplanation>(
        'explanation_v1',
        `Cannot build an explanation: ${walletResult.data === null ? walletResult.justification : ''} ${riskResult.data === null ? riskResult.justification : ''}`.trim()
      );
    }

    const w = walletResult.data;
    const r = riskResult.data;

    const keyActivities = [
      `${w.transactionCount} transaction(s) observed (${w.successfulTransactions} successful, ${w.failedTransactions} failed).`,
      `${w.tokenBalances.length} SPL token account(s) held.`,
    ];
    const riskAssessment = `Risk score ${r.score}/100 (${r.level}).`;
    const patterns = r.reasoning.length > 0 ? r.reasoning : ['No specific behavioral patterns triggered by the fixed risk thresholds.'];
    const disclaimer = 'This explanation is generated from real, deterministic pipeline output only. Not financial advice.';

    const deterministicSummary = `${keyActivities.join(' ')} ${riskAssessment} ${patterns.join(' ')}`.trim();

    const prompt = [
      'Rephrase the following already-verified facts about a Solana wallet into 2-3 plain-language sentences.',
      'Do not add any fact, number, or claim that is not listed below. Do not speculate.',
      `Transaction count: ${w.transactionCount} (${w.successfulTransactions} successful, ${w.failedTransactions} failed).`,
      `Token accounts held: ${w.tokenBalances.length}.`,
      `Risk score: ${r.score}/100 (${r.level}).`,
      `Risk reasoning: ${patterns.join('; ')}.`,
    ].join('\n');

    const aiResult = await this.chainGptClient.generateExplanation(prompt);

    const summary = aiResult.ok ? aiResult.text.trim() : deterministicSummary;
    const summarySource: AIExplanation['summarySource'] = aiResult.ok ? 'chaingpt' : 'deterministic';

    const data: AIExplanation = {
      summary,
      summarySource,
      keyActivities,
      riskAssessment,
      patterns,
      disclaimer,
    };

    return {
      agentId: 'explanation_v1',
      timestamp: Date.now(),
      evidenceStatus: EvidenceStatus.VERIFIED,
      confidenceScore: Math.min(walletResult.confidenceScore, riskResult.confidenceScore),
      data,
      justification: aiResult.ok
        ? 'keyActivities/riskAssessment/patterns computed directly from WalletIntelligenceAgent and RiskAgent output; summary is a ChainGPT rephrasing of those same facts (prompt included no other information).'
        : `keyActivities/riskAssessment/patterns computed directly from WalletIntelligenceAgent and RiskAgent output; summary fell back to a deterministic sentence because ChainGPT was unavailable: ${aiResult.reason}`,
    };
  }
}
