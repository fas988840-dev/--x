/**
 * Live Alert Watcher - the standing, WebSocket-driven counterpart to
 * AlertEngine's one-shot, per-request evaluation (src/services/alert-engine.ts).
 * This is the "upgrade the Alert system to live/streaming" gap named
 * explicitly in this project's own funding-application drafts - now real.
 *
 * How it works: subscribes to new log notifications for a wallet via
 * SolanaRpcClient.subscribeToLogs() (a read-only WebSocket subscription -
 * never a signed transaction). Each notification re-evaluates the
 * wallet's most recent transactions through the same deterministic
 * pipeline (BehaviorAnalyzer -> RiskAssessor -> AlertEngine) the REST
 * /alerts endpoint already uses, and reports only alerts that are new
 * since this watcher started (never re-announces one already seen) - so a
 * caller streaming this gets exactly the same evidence-cited Alert
 * objects as the one-shot endpoint, just delivered as they happen instead
 * of only on request.
 *
 * ⚠️ VERIFICATION STATUS: Solana RPC access was blocked by this sandbox's
 * network egress policy when this was written, so this has NOT been
 * exercised against a live subscription - see the verification note on
 * SolanaRpcClient.subscribeToLogs() for what's confirmed vs. assumed
 * about that API. Separately, and independent of this sandbox: many
 * public/free RPC endpoints (including the default
 * api.mainnet-beta.solana.com) restrict or disable WebSocket log
 * subscriptions - a dedicated RPC provider is typically required for this
 * to hold a subscription reliably in production. Test against a real
 * endpoint before relying on it.
 */

import { WalletAddress, Alert, validateWalletAddress } from '../types/domain.js';
import { SolanaRpcClient } from './solana-rpc-client.js';
import { TransactionRetriever } from './transaction-retriever.js';
import { BehaviorAnalyzer } from './behavior-analyzer.js';
import { RiskAssessor } from './risk-assessor.js';
import { AlertEngine } from './alert-engine.js';

export interface LiveAlertSubscription {
  /** Cancels the underlying RPC subscription. Never throws. */
  stop: () => Promise<void>;
}

export class LiveAlertWatcher {
  constructor(
    private rpcClient: SolanaRpcClient,
    private transactionRetriever: TransactionRetriever,
    private behaviorAnalyzer: BehaviorAnalyzer,
    private riskAssessor: RiskAssessor,
    private alertEngine: AlertEngine
  ) {}

  /**
   * Starts watching `address`. Throws (synchronously) on an invalid
   * address, the same as the deterministic services elsewhere in this
   * codebase - callers should validate/catch before calling, same as any
   * other service method here.
   *
   * @param onAlert called once per genuinely-new Alert (never a repeat of
   *   one already reported by this subscription).
   * @param limit how many of the wallet's most recent transactions to
   *   re-examine on each notification - kept independent of any HTTP
   *   request's own limit param, same RPC-cost-conscious bounding as
   *   WalletIntelligenceAgent.PROTOCOL_SCAN_LIMIT / EvidenceEngine.
   */
  watch(address: string, onAlert: (alert: Alert) => void, limit = 20): LiveAlertSubscription {
    const validated: WalletAddress = validateWalletAddress(address);
    const seen = new Set<string>();
    let active = true;

    const evaluate = async (): Promise<void> => {
      if (!active) return;
      try {
        const transactions = await this.transactionRetriever.getWalletTransactionsMeta(validated, limit);
        const behavior = this.behaviorAnalyzer.analyzeBehavior(transactions, [], new Set(), new Set());
        const risk = this.riskAssessor.assessRisk(behavior);
        const alerts = this.alertEngine.evaluate(validated, behavior, risk);

        for (const alert of alerts) {
          // Dedupe on the real evidence, not the random UUID `id` field
          // (a fresh id every evaluation would defeat deduping entirely).
          const key = `${alert.type}|${alert.evidence.join('|')}`;
          if (seen.has(key)) continue;
          seen.add(key);
          onAlert(alert);
        }
      } catch {
        // A transient RPC failure on one notification must not kill the
        // subscription - the next onLogs notification retries.
      }
    };

    // Evaluate once immediately so a caller sees the wallet's current
    // alert state right away, not only after the next new transaction.
    void evaluate();

    const subscriptionId = this.rpcClient.subscribeToLogs(validated, () => {
      void evaluate();
    });

    return {
      stop: async () => {
        active = false;
        await this.rpcClient.unsubscribeFromLogs(subscriptionId);
      },
    };
  }
}
