import { beforeEach, describe, it, expect } from 'vitest';
import { TokenBalance, TokenBalanceDeltaCalculator, normalizeAmount } from '../services/token-balance-delta';
import { Token, validateTokenMint } from '../types/domain';

describe('TokenBalanceDeltaCalculator', () => {
  let calculator: TokenBalanceDeltaCalculator;

  beforeEach(() => {
    calculator = new TokenBalanceDeltaCalculator();
  });

  describe('normalizeAmount', () => {
    it('should safely normalize small amounts', () => {
      // 1 USDC = 1,000,000 (6 decimals)
      const normalized = normalizeAmount('1000000', 6);
      expect(normalized).toBe(1);
    });

    it('should safely normalize SOL amounts', () => {
      // 1 SOL = 1,000,000,000 (9 decimals)
      const normalized = normalizeAmount('1000000000', 9);
      expect(normalized).toBe(1);
    });

    it('should return null for very large amounts to avoid precision loss', () => {
      // Amount larger than safe JavaScript number
      const largeAmount = '999999999999999999999999999999';
      const normalized = normalizeAmount(largeAmount, 6);
      expect(normalized).toBeNull();
    });

    it('should handle zero amount', () => {
      const normalized = normalizeAmount('0', 6);
      expect(normalized).toBe(0);
    });
  });

  describe('Balance Delta Calculation', () => {
    it('should calculate delta for balance increase', () => {
      const preBalances = [
        {
          owner: 'wallet1',
          mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
          amount: '1000000',
          decimals: 6,
          uiAmount: null,
        },
      ];

      const postBalances = [
        {
          owner: 'wallet1',
          mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          amount: '2000000',
          decimals: 6,
          uiAmount: null,
        },
      ];

      const deltas = calculator.calculateDeltas(preBalances, postBalances, new Map());

      expect(deltas).toHaveLength(1);
      expect(deltas[0].beforeAmount).toBe('1000000');
      expect(deltas[0].afterAmount).toBe('2000000');
    });

    it('should detect new token accounts', () => {
      const preBalances: TokenBalance[] = [];

      const postBalances = [
        {
          owner: 'wallet1',
          mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          amount: '1000000',
          decimals: 6,
          uiAmount: null,
        },
      ];

      const deltas = calculator.calculateDeltas(preBalances, postBalances, new Map());

      expect(deltas).toHaveLength(1);
      expect(deltas[0].beforeAmount).toBe('0');
      expect(deltas[0].afterAmount).toBe('1000000');
    });

    it('should detect closed token accounts', () => {
      const preBalances = [
        {
          owner: 'wallet1',
          mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          amount: '1000000',
          decimals: 6,
          uiAmount: null,
        },
      ];

      const postBalances: TokenBalance[] = [];

      const deltas = calculator.calculateDeltas(preBalances, postBalances, new Map());

      expect(deltas).toHaveLength(1);
      expect(deltas[0].beforeAmount).toBe('1000000');
      expect(deltas[0].afterAmount).toBe('0');
    });
  });

  describe('TokenBalanceDelta Conversion', () => {
    it('should convert balance delta with correct direction', () => {
      const delta = {
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        owner: 'wallet1',
        beforeAmount: '1000000',
        afterAmount: '2000000',
        decimals: 6,
      };

      const token: Token = {
        mint: validateTokenMint('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
        symbol: 'USDC',
        decimals: 6,
        name: 'USD Coin',
      };

      const balanceDelta = calculator.toTokenBalanceDelta(delta, token);

      expect(balanceDelta.direction).toBe('in');
      expect(balanceDelta.amount).toBe('1000000'); // Increase amount
      expect(balanceDelta.amountNormalized).toBe(1); // 1 USDC
    });

    it('should handle outflow correctly', () => {
      const delta = {
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        owner: 'wallet1',
        beforeAmount: '2000000',
        afterAmount: '1000000',
        decimals: 6,
      };

      const token: Token = {
        mint: validateTokenMint('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
        symbol: 'USDC',
        decimals: 6,
        name: 'USD Coin',
      };

      const balanceDelta = calculator.toTokenBalanceDelta(delta, token);

      expect(balanceDelta.direction).toBe('out');
      expect(balanceDelta.amount).toBe('1000000'); // Decrease amount
    });
  });
});
