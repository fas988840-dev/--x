import { describe, it, expect, vi } from 'vitest';
import { AgentRouter } from './agent-router';
import {
  EvidenceStatus,
  WalletIntelligenceAgent,
  TransactionIntelligenceAgent,
  RiskAgent,
  ResearchAgent,
  MarketEventAgent,
  AlertAgent,
} from './core_agents';
import { EvidenceEngine } from './evidence-engine';

function mockAgentResponse(data: unknown = {}) {
  return {
    agentId: 'x',
    timestamp: Date.now(),
    evidenceStatus: EvidenceStatus.VERIFIED,
    confidenceScore: 1,
    data,
    justification: 'ok',
  };
}

describe('AgentRouter', () => {
  it('routes wallet_overview to WalletIntelligenceAgent.analyzeWallet', async () => {
    const walletAgent = { analyzeWallet: vi.fn().mockResolvedValue(mockAgentResponse()) } as unknown as WalletIntelligenceAgent;
    const router = new AgentRouter(
      walletAgent,
      {} as TransactionIntelligenceAgent,
      {} as RiskAgent,
      {} as EvidenceEngine,
      {} as AlertAgent,
      {} as ResearchAgent,
      {} as MarketEventAgent
    );

    await router.route('wallet_overview', { address: 'addr', limit: 5 });

    expect(walletAgent.analyzeWallet).toHaveBeenCalledWith('addr', 5);
  });

  it('routes transaction_lookup to TransactionIntelligenceAgent.parseTx', async () => {
    const txAgent = { parseTx: vi.fn().mockResolvedValue(mockAgentResponse()) } as unknown as TransactionIntelligenceAgent;
    const router = new AgentRouter(
      {} as WalletIntelligenceAgent,
      txAgent,
      {} as RiskAgent,
      {} as EvidenceEngine,
      {} as AlertAgent,
      {} as ResearchAgent,
      {} as MarketEventAgent
    );

    await router.route('transaction_lookup', { signature: 'sig' });

    expect(txAgent.parseTx).toHaveBeenCalledWith('sig');
  });

  it('routes market_events to MarketEventAgent.trackEvents', async () => {
    const marketAgent = { trackEvents: vi.fn().mockResolvedValue(mockAgentResponse()) } as unknown as MarketEventAgent;
    const router = new AgentRouter(
      {} as WalletIntelligenceAgent,
      {} as TransactionIntelligenceAgent,
      {} as RiskAgent,
      {} as EvidenceEngine,
      {} as AlertAgent,
      {} as ResearchAgent,
      marketAgent
    );

    await router.route('market_events', { topic: 't' });

    expect(marketAgent.trackEvents).toHaveBeenCalledWith('t');
  });

  it('routes wallet_alerts to AlertAgent.evaluateWallet', async () => {
    const alertAgent = { evaluateWallet: vi.fn().mockResolvedValue(mockAgentResponse({ alerts: [] })) } as unknown as AlertAgent;
    const router = new AgentRouter(
      {} as WalletIntelligenceAgent,
      {} as TransactionIntelligenceAgent,
      {} as RiskAgent,
      {} as EvidenceEngine,
      alertAgent,
      {} as ResearchAgent,
      {} as MarketEventAgent
    );

    await router.route('wallet_alerts', { address: 'addr', limit: 5 });

    expect(alertAgent.evaluateWallet).toHaveBeenCalledWith('addr', 5);
  });

  it('returns UNKNOWN instead of calling any agent when a required param is missing', async () => {
    const walletAgent = { analyzeWallet: vi.fn() } as unknown as WalletIntelligenceAgent;
    const router = new AgentRouter(
      walletAgent,
      {} as TransactionIntelligenceAgent,
      {} as RiskAgent,
      {} as EvidenceEngine,
      {} as AlertAgent,
      {} as ResearchAgent,
      {} as MarketEventAgent
    );

    const result = await router.route('wallet_overview', {});

    expect(result.evidenceStatus).toBe(EvidenceStatus.UNKNOWN);
    expect(result.data).toBeNull();
    expect(walletAgent.analyzeWallet).not.toHaveBeenCalled();
  });
});
