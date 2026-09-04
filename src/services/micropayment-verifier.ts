import { SolanaRpcClient } from './solana-rpc-client.js';

export interface PaymentReplayStore {
  has(signature: string): Promise<boolean> | boolean;
  markConsumed(signature: string): Promise<void> | void;
}

/**
 * Development/test replay store. Production payment consumption must use a
 * durable datastore with uniqueness constraints so a restart cannot permit a
 * paid signature to be reused.
 */
export class InMemoryPaymentReplayStore implements PaymentReplayStore {
  private readonly consumed = new Set<string>();

  has(signature: string): boolean {
    return this.consumed.has(signature);
  }

  markConsumed(signature: string): void {
    this.consumed.add(signature);
  }
}

export interface MicropaymentVerifierOptions {
  recipient: string;
  minimumLamports: number;
  replayStore: PaymentReplayStore;
}

export type MicropaymentVerificationResult =
  | { ok: true; signature: string; recipient: string; lamports: number }
  | {
      ok: false;
      reason:
        | 'already_used'
        | 'not_finalized'
        | 'transaction_unavailable'
        | 'transaction_failed'
        | 'matching_transfer_not_found';
    };

interface ParsedSystemTransfer {
  program?: unknown;
  parsed?: {
    type?: unknown;
    info?: {
      destination?: unknown;
      lamports?: unknown;
    };
  };
}

function findMatchingTransfer(
  instructions: unknown[],
  recipient: string,
  minimumLamports: number
): number | null {
  for (const instruction of instructions) {
    if (!instruction || typeof instruction !== 'object') continue;
    const candidate = instruction as ParsedSystemTransfer;
    if (candidate.program !== 'system' || candidate.parsed?.type !== 'transfer') continue;

    const destination = candidate.parsed.info?.destination;
    const lamports = candidate.parsed.info?.lamports;
    if (destination !== recipient || typeof lamports !== 'number') continue;
    if (!Number.isSafeInteger(lamports) || lamports < minimumLamports) continue;
    return lamports;
  }

  return null;
}

/**
 * Verifies a SOL micropayment by reading a finalized transaction. It checks the
 * exact recipient, minimum lamport amount, transaction success, and replay
 * status. It never signs or submits a transaction and never accepts a client
 * supplied amount as proof of payment.
 */
export class MicropaymentVerifier {
  constructor(
    private readonly rpcClient: SolanaRpcClient,
    private readonly options: MicropaymentVerifierOptions
  ) {
    if (!Number.isSafeInteger(options.minimumLamports) || options.minimumLamports <= 0) {
      throw new Error('minimumLamports must be a positive safe integer');
    }
  }

  async verifyAndConsume(signature: string): Promise<MicropaymentVerificationResult> {
    if (await this.options.replayStore.has(signature)) {
      return { ok: false, reason: 'already_used' };
    }

    const confirmationStatus = await this.rpcClient.getTransactionConfirmationStatus(signature);
    if (confirmationStatus !== 'finalized') {
      return { ok: false, reason: 'not_finalized' };
    }

    const transaction = await this.rpcClient.getTransaction(signature);
    if (!transaction) return { ok: false, reason: 'transaction_unavailable' };
    if (transaction.meta?.err) return { ok: false, reason: 'transaction_failed' };

    const instructions = transaction.transaction.message.instructions as unknown[];
    const lamports = findMatchingTransfer(instructions, this.options.recipient, this.options.minimumLamports);
    if (lamports === null) return { ok: false, reason: 'matching_transfer_not_found' };

    await this.options.replayStore.markConsumed(signature);
    return {
      ok: true,
      signature,
      recipient: this.options.recipient,
      lamports,
    };
  }
}
