/**
 * Evidence Engine - turns a wallet's real transaction history into a flat
 * list of per-instruction evidence entries (transaction signature, slot,
 * program, and an honest confidence derived from a fixed, documented
 * mapping - never an invented per-instance number like "97%").
 *
 * confidencePercent mapping (deterministic, not a guess):
 *   confirmed -> 100  (a registered DexRegistry adapter decoded it)
 *   candidate -> 50   (looks like a swap, unverified)
 *   unknown   -> 0    (no adapter registered for this program)
 *
 * Every entry is built only from instructions actually returned by
 * TransactionIntelligenceAgent for a transaction that was actually found
 * on-chain - a transaction that fails to fetch/parse is skipped, not
 * papered over with a placeholder entry.
 */

import { WalletAddress, validateWalletAddress, ParsedInstructionStatus } from '../types/domain.js';
import { TransactionRetriever } from '../services/transaction-retriever.js';
import { AgentResponse, EvidenceStatus, TransactionIntelligenceAgent } from './core_agents.js';

const CONFIDENCE_PERCENT: Record<ParsedInstructionStatus, number> = {
  confirmed: 100,
  candidate: 50,
  unknown: 0,
};

export interface EvidenceEntry {
  transactionSignature: string;
  slot: number;
  programId: string;
  programName: string;
  status: ParsedInstructionStatus;
  confidencePercent: number;
}

export interface WalletEvidenceReport {
  wallet: string;
  transactionsExamined: number;
  transactionsSkipped: number; // fetched signature but couldn't parse - reported, not hidden
  evidence: EvidenceEntry[];
}

function unknownReport(agentId: string, justification: string): AgentResponse<WalletEvidenceReport> {
  return {
    agentId,
    timestamp: Date.now(),
    evidenceStatus: EvidenceStatus.UNKNOWN,
    confidenceScore: 0,
    data: null,
    justification,
  };
}

export class EvidenceEngine {
  constructor(
    private transactionRetriever: TransactionRetriever,
    private transactionIntelligenceAgent: TransactionIntelligenceAgent
  ) {}

  /**
   * Builds a wallet's evidence report.
   * @param limit defaults low (10) since this makes one additional RPC
   *   round-trip per transaction (raw fetch + instruction parse) on top
   *   of the initial signature list - keep this small in interactive
   *   contexts (see the heavyLimiter applied to its API route).
   */
  async buildWalletEvidence(address: string, limit = 10): Promise<AgentResponse<WalletEvidenceReport>> {
    let validated: WalletAddress;
    try {
      validated = validateWalletAddress(address);
    } catch (error) {
      return unknownReport('evidence_engine_v1', `Invalid wallet address: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      const transactions = await this.transactionRetriever.getWalletTransactionsMeta(validated, limit);
      const evidence: EvidenceEntry[] = [];
      let skipped = 0;

      for (const tx of transactions) {
        const parsed = await this.transactionIntelligenceAgent.parseTx(tx.signature);
        if (!parsed.data) {
          skipped += 1;
          continue;
        }
        for (const ix of parsed.data.instructions) {
          evidence.push({
            transactionSignature: tx.signature,
            slot: tx.slot,
            programId: ix.programId,
            programName: ix.programName,
            status: ix.status,
            confidencePercent: CONFIDENCE_PERCENT[ix.status],
          });
        }
      }

      return {
        agentId: 'evidence_engine_v1',
        timestamp: Date.now(),
        evidenceStatus: EvidenceStatus.VERIFIED,
        confidenceScore: 1,
        data: {
          wallet: validated,
          transactionsExamined: transactions.length,
          transactionsSkipped: skipped,
          evidence,
        },
        justification: `Examined ${transactions.length} real transaction(s) (${skipped} could not be parsed and were excluded, not fabricated); ${evidence.length} instruction-level evidence entr${evidence.length === 1 ? 'y' : 'ies'} extracted via TransactionIntelligenceAgent.`,
      };
    } catch (error) {
      return unknownReport('evidence_engine_v1', `RPC read failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
