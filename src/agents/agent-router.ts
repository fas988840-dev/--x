/**
 * Agent Router - a single, deterministic entry point that dispatches to
 * the right agent in src/agents/core_agents.ts / evidence-engine.ts.
 *
 * IMPORTANT: this is NOT natural-language intent classification. There is
 * no NLP/LLM step here that guesses what a free-form question "means" -
 * that would risk misrouting or inventing an interpretation. The caller
 * passes an explicit `intent` enum value; the router's only job is a
 * deterministic switch to the matching agent. This keeps the same
 * no-fabrication guarantee as everything else: routing is 100%
 * predictable from its input, not a model's guess.
 */

import {
  AgentResponse,
  WalletIntelligenceAgent,
  WalletIntelligenceData,
  TransactionIntelligenceAgent,
  TransactionIntelligenceData,
  RiskAgent,
  ResearchAgent,
  ResearchReportData,
  MarketEventAgent,
  MarketEventData,
  EvidenceStatus,
} from './core_agents';
import { EvidenceEngine, WalletEvidenceReport } from './evidence-engine';
import { RiskScore } from '../types/domain';

export type AgentIntent =
  | 'wallet_overview'
  | 'transaction_lookup'
  | 'wallet_risk'
  | 'wallet_evidence'
  | 'research_report'
  | 'market_events';

export const AGENT_INTENTS: readonly AgentIntent[] = [
  'wallet_overview',
  'transaction_lookup',
  'wallet_risk',
  'wallet_evidence',
  'research_report',
  'market_events',
];

export interface AgentRouterParams {
  address?: string;
  signature?: string;
  topic?: string;
  limit?: number;
}

export type AgentRouterResult =
  | AgentResponse<WalletIntelligenceData>
  | AgentResponse<TransactionIntelligenceData>
  | AgentResponse<RiskScore>
  | AgentResponse<WalletEvidenceReport>
  | AgentResponse<ResearchReportData>
  | AgentResponse<MarketEventData>;

function missingParam(intent: AgentIntent, param: string): AgentResponse<never> {
  return {
    agentId: 'agent_router_v1',
    timestamp: Date.now(),
    evidenceStatus: EvidenceStatus.UNKNOWN,
    confidenceScore: 0,
    data: null,
    justification: `Intent '${intent}' requires '${param}', which was not provided.`,
  };
}

export class AgentRouter {
  constructor(
    private walletAgent: WalletIntelligenceAgent,
    private txAgent: TransactionIntelligenceAgent,
    private riskAgent: RiskAgent,
    private evidenceEngine: EvidenceEngine,
    private researchAgent: ResearchAgent,
    private marketAgent: MarketEventAgent
  ) {}

  async route(intent: AgentIntent, params: AgentRouterParams): Promise<AgentRouterResult> {
    switch (intent) {
      case 'wallet_overview':
        if (!params.address) return missingParam(intent, 'address');
        return this.walletAgent.analyzeWallet(params.address, params.limit);

      case 'transaction_lookup':
        if (!params.signature) return missingParam(intent, 'signature');
        return this.txAgent.parseTx(params.signature);

      case 'wallet_risk':
        if (!params.address) return missingParam(intent, 'address');
        return this.riskAgent.evaluateRisk(params.address, params.limit);

      case 'wallet_evidence':
        if (!params.address) return missingParam(intent, 'address');
        return this.evidenceEngine.buildWalletEvidence(params.address, params.limit);

      case 'research_report':
        if (!params.address) return missingParam(intent, 'address');
        return this.researchAgent.generateReport(params.address, params.limit);

      case 'market_events':
        if (!params.topic) return missingParam(intent, 'topic');
        return this.marketAgent.trackEvents(params.topic);

      default: {
        // Exhaustiveness check: if a new AgentIntent is added without a
        // case above, this fails to compile rather than silently
        // returning nothing.
        const _exhaustive: never = intent;
        return _exhaustive;
      }
    }
  }
}
