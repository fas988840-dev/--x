/**
 * Token Balance Delta Calculator
 * Analyzes pre/post token balances to determine token flows
 * CRITICAL: Never fabricates amounts. Returns null when data unavailable.
 */

import { TokenBalanceDelta, Token } from '../types/domain';

/**
 * Pre/post balance for a token account
 */
export interface TokenBalance {
  owner: string;
  mint: string;
  amount: string; // Raw amount as string
  decimals: number;
  uiAmount: number | null; // UI representation (may lose precision)
}

/**
 * Token balance change
 */
export interface BalanceChange {
  mint: string;
  owner: string;
  beforeAmount: string;
  afterAmount: string;
  decimals: number;
}

/**
 * Calculates if a normalized amount can be safely represented
 */
function canSafelyNormalize(rawAmount: string, _decimals: number): boolean {
  // If raw amount is larger than Number.MAX_SAFE_INTEGER, cannot safely normalize
  const maxSafeAmount = Math.pow(10, 15); // Roughly MAX_SAFE_INTEGER / 1000
  try {
    const numAmount = BigInt(rawAmount);
    const maxBig = BigInt(maxSafeAmount.toString());
    return numAmount <= maxBig;
  } catch {
    return false;
  }
}

/**
 * Safely normalize raw amount to human-readable decimal
 * Returns null if precision would be lost
 */
export function normalizeAmount(rawAmount: string, decimals: number): number | null {
  if (!canSafelyNormalize(rawAmount, decimals)) {
    return null; // Cannot safely represent
  }

  try {
    const divisor = Math.pow(10, decimals);
    const numAmount = BigInt(rawAmount);
    const normalized = Number(numAmount) / divisor;
    return normalized;
  } catch {
    return null;
  }
}

/**
 * Token Balance Delta Calculator
 */
export class TokenBalanceDeltaCalculator {
  /**
   * Calculate balance deltas between pre and post balances
   */
  calculateDeltas(
    preBalances: TokenBalance[],
    postBalances: TokenBalance[],
    _tokenMetadata: Map<string, Token>
  ): BalanceChange[] {
    const deltas: BalanceChange[] = [];

    // Create map of post-balances by mint+owner
    const postMap = new Map<string, TokenBalance>();
    for (const balance of postBalances) {
      postMap.set(`${balance.mint}:${balance.owner}`, balance);
    }

    // Check all pre-balances for changes
    for (const preBalance of preBalances) {
      const key = `${preBalance.mint}:${preBalance.owner}`;
      const postBalance = postMap.get(key);

      if (!postBalance) {
        // Token account was closed or empty
        deltas.push({
          mint: preBalance.mint,
          owner: preBalance.owner,
          beforeAmount: preBalance.amount,
          afterAmount: '0',
          decimals: preBalance.decimals,
        });
      } else if (preBalance.amount !== postBalance.amount) {
        // Balance changed
        deltas.push({
          mint: preBalance.mint,
          owner: preBalance.owner,
          beforeAmount: preBalance.amount,
          afterAmount: postBalance.amount,
          decimals: preBalance.decimals,
        });
      }
      postMap.delete(key);
    }

    // Check for new token accounts (pre-balance not present)
    for (const postBalance of postMap.values()) {
      deltas.push({
        mint: postBalance.mint,
        owner: postBalance.owner,
        beforeAmount: '0',
        afterAmount: postBalance.amount,
        decimals: postBalance.decimals,
      });
    }

    return deltas;
  }

  /**
   * Convert balance change to TokenBalanceDelta
   */
  toTokenBalanceDelta(delta: BalanceChange, token: Token): TokenBalanceDelta {
    const before = BigInt(delta.beforeAmount);
    const after = BigInt(delta.afterAmount);
    const change = after - before;

    // Determine direction
    let direction: 'in' | 'out' | 'unknown' = 'unknown';
    let amount = '0';
    if (change > 0n) {
      direction = 'in';
      amount = change.toString();
    } else if (change < 0n) {
      direction = 'out';
      amount = (-change).toString();
    }

    // Normalize amount safely
    const amountNormalized = normalizeAmount(amount, delta.decimals);

    return {
      token,
      amount,
      amountDecimals: delta.decimals,
      amountNormalized,
      direction,
      confidence: 'high', // Blockchain data is always accurate
    };
  }
}
