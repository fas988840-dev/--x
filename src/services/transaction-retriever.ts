/**
 * Transaction retrieval service
 * Fetches and normalizes transaction data from Solana
 */

import { ParsedTransactionWithMeta, SystemProgram } from '@solana/web3.js';
import { SolanaRpcClient } from './solana-rpc-client';
import { TransactionMeta, TransactionSignature, WalletAddress, validateTransactionSignature, validateWalletAddress, Instruction, ProgramId, validateProgramId } from '../types/domain';
import { RpcError, ValidationError } from '../types/errors';

export class TransactionRetriever {
  constructor(private rpcClient: SolanaRpcClient) {}

  /**
   * Get all transactions for wallet
   */
  async getWalletTransactionsMeta(walletAddress: WalletAddress, limit: number = 100): Promise<TransactionMeta[]> {
    try {
      validateWalletAddress(walletAddress);

      const signatures = await this.rpcClient.getWalletTransactions(walletAddress, limit);

      const transactions: TransactionMeta[] = [];

      for (const signature of signatures) {
        try {
          const tx = await this.rpcClient.getTransaction(signature);
          if (!tx) continue;

          const meta = this.parseTransactionMeta(signature as TransactionSignature, tx);
          transactions.push(meta);
        } catch (error) {
          // Log but continue if single transaction fails
          console.warn(`Failed to parse transaction ${signature}:`, error);
        }
      }

      return transactions;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new RpcError(
        `Failed to retrieve wallet transactions: ${error instanceof Error ? error.message : String(error)}`,
        500
      );
    }
  }

  /**
   * Get specific transaction
   */
  async getTransaction(signature: TransactionSignature): Promise<TransactionMeta | null> {
    try {
      validateTransactionSignature(signature);

      const tx = await this.rpcClient.getTransaction(signature);
      if (!tx) return null;

      return this.parseTransactionMeta(signature, tx);
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new RpcError(
        `Failed to retrieve transaction: ${error instanceof Error ? error.message : String(error)}`,
        500
      );
    }
  }

  /**
   * Extract instructions from transaction
   */
  extractInstructions(tx: ParsedTransactionWithMeta): Instruction[] {
    const instructions: Instruction[] = [];

    if (!tx.transaction.message.instructions) return instructions;

    for (const ix of tx.transaction.message.instructions) {
      try {
        const instruction: Instruction = {
          programId: validateProgramId(ix.programId.toString()),
          data: Buffer.from(ix.data || '', 'base64'),
          accounts: (ix.accounts || []).map((account, index) => ({
            pubkey: account.toString(),
            isSigner: tx.transaction.message.accountKeys[index]?.signer ?? false,
            isWritable: tx.transaction.message.accountKeys[index]?.writable ?? false,
          })),
        };
        instructions.push(instruction);
      } catch (error) {
        console.warn('Failed to parse instruction:', error);
      }
    }

    return instructions;
  }

  /**
   * Parse transaction metadata
   */
  private parseTransactionMeta(signature: TransactionSignature, tx: ParsedTransactionWithMeta): TransactionMeta {
    const meta = tx.transaction.meta;

    let status: 'success' | 'failed' | 'unknown' = 'unknown';
    if (meta?.err === null) {
      status = 'success';
    } else if (meta?.err !== undefined) {
      status = 'failed';
    }

    const fee = meta?.fee ?? 5000; // Default to minimum fee if unavailable

    const logMessages = meta?.logMessages ?? [];

    return {
      signature,
      slot: tx.slot,
      blockTime: tx.blockTime ?? Math.floor(Date.now() / 1000),
      status,
      fee,
      logMessages,
    };
  }
}
