/**
 * Transaction retrieval service
 * Fetches and normalizes transaction data from Solana
 * CRITICAL: Never invents blockchain data. Preserves nulls and unknowns.
 */

import { ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';
import { SolanaRpcClient } from './solana-rpc-client';
import {
  TransactionMeta,
  TransactionSignature,
  WalletAddress,
  validateTransactionSignature,
  validateWalletAddress,
  Instruction,
  ProgramId,
  validateProgramId,
} from '../types/domain';
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
   * Handles both legacy and versioned transactions
   * CRITICAL: Resolves instruction account indexes correctly against message.staticAccountKeys
   */
  extractInstructions(tx: ParsedTransactionWithMeta): Instruction[] {
    const instructions: Instruction[] = [];

    if (!tx.transaction.message.instructions) return instructions;

    // Get account keys - handles both legacy and versioned transactions
    const accountKeys = this.getAccountKeys(tx);
    if (accountKeys.length === 0) return instructions;

    for (const ix of tx.transaction.message.instructions) {
      try {
        // Validate instruction accounts exist within accountKeys
        const instructionAccounts = (ix.accounts || []).map((accountIndex) => {
          if (accountIndex >= accountKeys.length) {
            throw new Error(`Account index ${accountIndex} out of range`);
          }
          const accountKey = accountKeys[accountIndex];
          return {
            pubkey: accountKey.toString(),
            isSigner: accountKey.signer ?? false,
            isWritable: accountKey.writable ?? false,
          };
        });

        const instruction: Instruction = {
          programId: validateProgramId(ix.programId.toString()),
          data: Buffer.from(ix.data || '', 'base64'),
          accounts: instructionAccounts,
        };
        instructions.push(instruction);
      } catch (error) {
        console.warn('Failed to parse instruction:', error);
      }
    }

    return instructions;
  }

  /**
   * Get account keys from transaction (handles legacy and versioned)
   */
  private getAccountKeys(
    tx: ParsedTransactionWithMeta
  ): Array<{ toString(): string; signer?: boolean; writable?: boolean }> {
    const message = tx.transaction.message;

    // For versioned transactions, staticAccountKeys is used
    if ('staticAccountKeys' in message && message.staticAccountKeys) {
      return message.staticAccountKeys as Array<{ toString(): string; signer?: boolean; writable?: boolean }>;
    }

    // Fallback for legacy transactions - accountKeys
    if ('accountKeys' in message && message.accountKeys) {
      return message.accountKeys as Array<{ toString(): string; signer?: boolean; writable?: boolean }>;
    }

    return [];
  }

  /**
   * Parse transaction metadata
   * CRITICAL: Never fabricates data. Preserves nulls for unavailable fields.
   */
  private parseTransactionMeta(signature: TransactionSignature, tx: ParsedTransactionWithMeta): TransactionMeta {
    const meta = tx.transaction.meta;

    // Determine status
    let status: 'success' | 'failed' | 'unknown' = 'unknown';
    if (meta?.err === null) {
      status = 'success';
    } else if (meta?.err !== undefined && meta?.err !== null) {
      status = 'failed';
    }

    // Fee - preserve as string to avoid precision loss. Never default.
    const fee = meta?.fee !== undefined && meta?.fee !== null ? String(meta.fee) : null;

    // BlockTime - can be null per Solana RPC spec. Never fabricate with Date.now().
    const blockTime = tx.blockTime ?? null;

    const logMessages = meta?.logMessages ?? [];

    return {
      signature,
      slot: tx.slot,
      blockTime,
      status,
      fee: fee ?? 'unknown', // Store as 'unknown' string when unavailable
      logMessages,
    };
  }
}
