/**
 * Solana RPC client - read-only blockchain access
 * NEVER signs transactions, NEVER requests credentials
 */

import { Connection, PublicKey, ParsedTransactionWithMeta, Logs } from '@solana/web3.js';
import { SolanaConfig } from '../types/config.js';
import { RpcError, ValidationError } from '../types/errors.js';
import {
  TokenMint,
  WalletAddress,
  validateTokenMint,
  validateTransactionSignature,
  validateWalletAddress,
} from '../types/domain.js';

export class SolanaRpcClient {
  private connection: Connection;
  private config: SolanaConfig;

  constructor(config: SolanaConfig) {
    this.config = config;
    this.connection = new Connection(config.rpcUrl, config.commitment);
  }

  async getWalletTransactions(walletAddress: WalletAddress, limit: number = 100): Promise<string[]> {
    try {
      validateWalletAddress(walletAddress);
      const pubkey = new PublicKey(walletAddress);
      const signatures = await this.connection.getSignaturesForAddress(pubkey, { limit });
      return signatures.map((s) => s.signature);
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new RpcError(
        `Failed to fetch wallet transactions: ${error instanceof Error ? error.message : String(error)}`,
        500
      );
    }
  }

  async getTransaction(signature: string): Promise<ParsedTransactionWithMeta | null> {
    try {
      validateTransactionSignature(signature);
      return await this.connection.getParsedTransaction(signature, 'confirmed');
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new RpcError(
        `Failed to fetch transaction: ${error instanceof Error ? error.message : String(error)}`,
        500
      );
    }
  }

  /**
   * Returns the network confirmation state for a transaction signature.
   * Payment verification uses this to require `finalized` before granting an
   * entitlement. This is read-only and never signs or submits anything.
   */
  async getTransactionConfirmationStatus(
    signature: string
  ): Promise<'processed' | 'confirmed' | 'finalized' | null> {
    try {
      validateTransactionSignature(signature);
      const response = await this.connection.getSignatureStatuses([signature], {
        searchTransactionHistory: true,
      });
      return response.value[0]?.confirmationStatus ?? null;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new RpcError(
        `Failed to fetch transaction confirmation status: ${error instanceof Error ? error.message : String(error)}`,
        500
      );
    }
  }

  async getTokenBalances(walletAddress: WalletAddress): Promise<Array<{ mint: string; amount: string; decimals: number }>> {
    try {
      validateWalletAddress(walletAddress);
      const pubkey = new PublicKey(walletAddress);
      const response = await this.connection.getParsedTokenAccountsByOwner(pubkey, {
        programId: new PublicKey('TokenkegQfeZyiNwAJsyFbPVwwQQfuM32jneSYOAxU'),
      });

      return response.value
        .filter((account) => account.account.data.parsed.info.tokenAmount.amount !== '0')
        .map((account) => ({
          mint: account.account.data.parsed.info.mint,
          amount: account.account.data.parsed.info.tokenAmount.amount,
          decimals: account.account.data.parsed.info.tokenAmount.decimals,
        }));
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new RpcError(
        `Failed to fetch token balances: ${error instanceof Error ? error.message : String(error)}`,
        500
      );
    }
  }

  async getMintInfo(mint: TokenMint): Promise<{
    mintAuthority: string | null;
    freezeAuthority: string | null;
    supply: string;
    decimals: number;
    isInitialized: boolean;
    owningProgramId: string;
  } | null> {
    try {
      validateTokenMint(mint);
      const pubkey = new PublicKey(mint);
      const response = await this.connection.getParsedAccountInfo(pubkey);
      const account = response.value;
      if (!account) return null;

      const data = account.data;
      if (!('parsed' in data)) return null;
      if (data.parsed?.type !== 'mint') return null;

      const info = data.parsed.info;
      if (!info) return null;

      return {
        mintAuthority: info.mintAuthority ?? null,
        freezeAuthority: info.freezeAuthority ?? null,
        supply: String(info.supply),
        decimals: Number(info.decimals),
        isInitialized: Boolean(info.isInitialized),
        owningProgramId: account.owner.toBase58(),
      };
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new RpcError(
        `Failed to fetch mint info: ${error instanceof Error ? error.message : String(error)}`,
        500
      );
    }
  }

  async getSolBalance(walletAddress: WalletAddress): Promise<number> {
    try {
      validateWalletAddress(walletAddress);
      const pubkey = new PublicKey(walletAddress);
      return await this.connection.getBalance(pubkey);
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new RpcError(
        `Failed to fetch SOL balance: ${error instanceof Error ? error.message : String(error)}`,
        500
      );
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const slot = await this.connection.getSlot();
      return slot > 0;
    } catch {
      return false;
    }
  }

  subscribeToLogs(walletAddress: WalletAddress, onLogs: (logs: Logs) => void): number {
    const pubkey = new PublicKey(walletAddress);
    return this.connection.onLogs(pubkey, (logs) => onLogs(logs), this.config.commitment);
  }

  async unsubscribeFromLogs(subscriptionId: number): Promise<void> {
    try {
      await this.connection.removeOnLogsListener(subscriptionId);
    } catch {
      // Already disconnected/invalid id - nothing more to clean up.
    }
  }
}
