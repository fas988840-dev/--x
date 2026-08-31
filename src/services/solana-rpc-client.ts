/**
 * Solana RPC client - read-only blockchain access
 * NEVER signs transactions, NEVER requests credentials
 */

import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';
import { SolanaConfig } from '../types/config';
import { RpcError, ValidationError } from '../types/errors';
import { WalletAddress, validateTransactionSignature, validateWalletAddress } from '../types/domain';

export class SolanaRpcClient {
  private connection: Connection;

  constructor(config: SolanaConfig) {
    this.connection = new Connection(config.rpcUrl, config.commitment);
  }

  /**
   * Get wallet transactions - read-only
   */
  async getWalletTransactions(
    walletAddress: WalletAddress,
    limit: number = 100
  ): Promise<string[]> {
    try {
      validateWalletAddress(walletAddress);

      const pubkey = new PublicKey(walletAddress);
      const signatures = await this.connection.getSignaturesForAddress(pubkey, {
        limit,
      });

      return signatures.map((s) => s.signature);
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new RpcError(
        `Failed to fetch wallet transactions: ${error instanceof Error ? error.message : String(error)}`,
        500
      );
    }
  }

  /**
   * Get transaction details - read-only
   */
  async getTransaction(signature: string): Promise<ParsedTransactionWithMeta | null> {
    try {
      validateTransactionSignature(signature);

      const tx = await this.connection.getParsedTransaction(signature, 'confirmed');
      return tx;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new RpcError(
        `Failed to fetch transaction: ${error instanceof Error ? error.message : String(error)}`,
        500
      );
    }
  }

  /**
   * Get token balances for wallet
   */
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

  /**
   * Get SOL balance
   */
  async getSolBalance(walletAddress: WalletAddress): Promise<number> {
    try {
      validateWalletAddress(walletAddress);

      const pubkey = new PublicKey(walletAddress);
      const balance = await this.connection.getBalance(pubkey);
      return balance; // in lamports
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new RpcError(
        `Failed to fetch SOL balance: ${error instanceof Error ? error.message : String(error)}`,
        500
      );
    }
  }

  /**
   * Health check
   */
  async isHealthy(): Promise<boolean> {
    try {
      const slot = await this.connection.getSlot();
      return slot > 0;
    } catch {
      return false;
    }
  }
}
