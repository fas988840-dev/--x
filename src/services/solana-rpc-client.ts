/**
 * Solana RPC client - read-only blockchain access
 * NEVER signs transactions, NEVER requests credentials
 */

import { Connection, PublicKey, ParsedTransactionWithMeta, Logs } from '@solana/web3.js';
import { SolanaConfig } from '../types/config';
import { RpcError, ValidationError } from '../types/errors';
import { WalletAddress, validateTransactionSignature, validateWalletAddress } from '../types/domain';

export class SolanaRpcClient {
  private connection: Connection;
  private config: SolanaConfig;

  constructor(config: SolanaConfig) {
    this.config = config;
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

  /**
   * Subscribes to new log notifications for a wallet address (read-only -
   * this is a WebSocket *subscription*, never a signed transaction). Used
   * by LiveAlertWatcher (src/services/live-alert-watcher.ts) to notice new
   * transactions as they land instead of only on request.
   *
   * ⚠️ Not independently verified against a live endpoint: Solana RPC was
   * blocked by this sandbox's network egress policy when this was written,
   * so `onLogs` has not actually been exercised here. It is written
   * against @solana/web3.js's documented Connection.onLogs API from
   * training knowledge. Separately, many public/free RPC endpoints
   * (including the default api.mainnet-beta.solana.com) rate-limit or
   * disable WebSocket log subscriptions entirely - a dedicated RPC
   * provider (e.g. Helius, QuickNode, Triton) is typically required for
   * this to work reliably in production. Test against a real endpoint
   * before relying on it.
   *
   * @returns a subscription id to pass to unsubscribeFromLogs()
   */
  subscribeToLogs(walletAddress: WalletAddress, onLogs: (logs: Logs) => void): number {
    const pubkey = new PublicKey(walletAddress);
    return this.connection.onLogs(pubkey, (logs) => onLogs(logs), this.config.commitment);
  }

  /**
   * Cancels a subscription created by subscribeToLogs(). Never throws -
   * callers (LiveAlertWatcher's stop()) should be able to unwind cleanly
   * even if the underlying WebSocket connection already dropped.
   */
  async unsubscribeFromLogs(subscriptionId: number): Promise<void> {
    try {
      await this.connection.removeOnLogsListener(subscriptionId);
    } catch {
      // Already disconnected/invalid id - nothing more to clean up.
    }
  }
}
