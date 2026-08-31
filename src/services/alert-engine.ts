/**
 * Alert Engine - deterministically evaluates already-computed real data
 * (BehaviorMetrics, RiskScore) for alert-worthy conditions.
 *
 * CRITICAL: this is not a live/streaming alert system - it does not watch
 * a wallet in real time (that needs a Geyser plugin or WebSocket feed,
 * neither of which exist in this codebase - see 'market_events' in
 * core_agents.ts). It evaluates the current state of a wallet's already-
 * fetched transaction history and reports what's true about it right now,
 * with every alert's `evidence` array citing the real numbers it was
 * triggered by - never an invented reason.
 */

import { randomUUID } from 'crypto';
import { Alert, AlertType, BehaviorMetrics, RiskScore, WalletAddress } from '../types/domain';

// Thresholds are fixed and documented here, not tuned per-wallet - keeps
// alerts reproducible from the same input, like every other score in this
// codebase.
const HIGH_FAILURE_RATE_THRESHOLD = 0.3;
const CRITICAL_FAILURE_RATE_THRESHOLD = 0.5;
const HIGH_FREQUENCY_THRESHOLD = 1000; // transactions in the examined window
const CONCENTRATION_MIN_TRANSACTIONS = 10; // below this, "only 1 program" isn't meaningfully concentrated

export class AlertEngine {
  /**
   * Evaluates a wallet's real behavior/risk data and returns any alerts
   * whose deterministic trigger condition is met. Returns an empty array
   * when nothing is triggered - never fabricates an alert to have
   * something to show.
   */
  evaluate(address: WalletAddress, behavior: BehaviorMetrics, risk: RiskScore): Alert[] {
    const alerts: Alert[] = [];
    const now = Math.floor(Date.now() / 1000);

    if (behavior.failureRate > HIGH_FAILURE_RATE_THRESHOLD) {
      alerts.push(
        this.build(
          address,
          now,
          'high_failure_rate',
          behavior.failureRate > CRITICAL_FAILURE_RATE_THRESHOLD ? 'high' : 'medium',
          'High transaction failure rate',
          `${behavior.failedTransactionCount} of ${behavior.transactionCount} examined transactions failed (${(behavior.failureRate * 100).toFixed(1)}%).`,
          [`failedTransactionCount=${behavior.failedTransactionCount}`, `transactionCount=${behavior.transactionCount}`, `failureRate=${behavior.failureRate.toFixed(4)}`]
        )
      );
    }

    if (behavior.transactionCount > HIGH_FREQUENCY_THRESHOLD) {
      alerts.push(
        this.build(
          address,
          now,
          'abnormal_frequency',
          'medium',
          'Unusually high transaction frequency',
          `${behavior.transactionCount} transactions in the examined window (threshold: ${HIGH_FREQUENCY_THRESHOLD}).`,
          [`transactionCount=${behavior.transactionCount}`]
        )
      );
    }

    if (behavior.transactionCount >= CONCENTRATION_MIN_TRANSACTIONS && behavior.uniqueProgramsInteracted <= 1) {
      alerts.push(
        this.build(
          address,
          now,
          'program_concentration',
          'low',
          'Single-program concentration',
          `${behavior.transactionCount} transactions but only ${behavior.uniqueProgramsInteracted} unique program(s) interacted with.`,
          [`uniqueProgramsInteracted=${behavior.uniqueProgramsInteracted}`, `transactionCount=${behavior.transactionCount}`]
        )
      );
    }

    if (risk.level === 'high') {
      alerts.push(
        this.build(
          address,
          now,
          'high_risk_behavior',
          'high',
          'High deterministic risk score',
          `Risk score ${risk.score}/100 (${risk.level}).${risk.reasoning.length > 0 ? ` Reasoning: ${risk.reasoning.join('; ')}.` : ''}`,
          risk.reasoning.length > 0 ? risk.reasoning : [`riskScore=${risk.score}`, `riskLevel=${risk.level}`]
        )
      );
    }

    // unusual_volume / large_swap / new_token_interaction are intentionally
    // never triggered here: they'd need real swap volume/token data, which
    // isn't populated yet (BehaviorAnalyzer's totalVolumeUSD/swapCount stay
    // null/0 until DEX decoding extracts real amounts - see
    // src/services/dex-registry.ts). Triggering them off absent data would
    // be exactly the kind of guess this engine exists to avoid.

    return alerts;
  }

  private build(
    address: WalletAddress,
    timestamp: number,
    type: AlertType,
    severity: Alert['severity'],
    title: string,
    description: string,
    evidence: string[]
  ): Alert {
    return {
      id: randomUUID(),
      walletAddress: address,
      timestamp,
      type,
      severity,
      title,
      description,
      evidence,
    };
  }
}
