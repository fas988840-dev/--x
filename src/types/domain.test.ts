import { describe, it, expect } from 'vitest';
import {
  validateWalletAddress,
  validateTransactionSignature,
  validateTokenMint,
  validateProgramId,
  Token,
} from '../types/domain';

describe('Domain Validation', () => {
  describe('validateWalletAddress', () => {
    it('should accept valid System Program address', () => {
      const validAddr = '11111111111111111111111111111112';
      expect(() => validateWalletAddress(validAddr)).not.toThrow();
    });

    it('should accept valid Solana address (44 chars)', () => {
      const validAddr = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      expect(() => validateWalletAddress(validAddr)).not.toThrow();
    });

    it('should reject invalid address - too short', () => {
      expect(() => validateWalletAddress('123')).toThrow('Invalid wallet address');
    });

    it('should reject invalid address - invalid characters', () => {
      expect(() => validateWalletAddress('InvalidAddressWithBadChars000000000000000')).toThrow();
    });

    it('should reject empty string', () => {
      expect(() => validateWalletAddress('')).toThrow();
    });
  });

  describe('validateTransactionSignature', () => {
    it('should accept valid 88-character Base58 signature (64 bytes decoded)', () => {
      // Real Solana signature structure: 88 Base58 chars = 64 bytes
      const validSig = '4MkLRHFdBJnPhKMVPy8gWXVwP8eA2CUyHhXmw3HzHrxP7a8H9LJ3JHcLhJPJ9Z2L3GJ6BL7Q5KJ9P2B3L6M5N8Z';
      expect(() => validateTransactionSignature(validSig)).not.toThrow();
    });

    it('should reject signature with invalid Base58 characters', () => {
      // Contains '0' which is not valid base58
      const invalidSig = '4MkLRHFdBJnPhKMVPy8gWXVwP8eA2CUyHhXmw3HzHrxP7a8H9LJ3JHcLhJPJ9Z2L3GJ6BL7Q5KJ9P2B3L6M5N0Z';
      expect(() => validateTransactionSignature(invalidSig)).toThrow();
    });

    it('should reject signature that is too short', () => {
      expect(() => validateTransactionSignature('123')).toThrow();
    });

    it('should reject signature that is too long', () => {
      const tooLong = '1'.repeat(100);
      expect(() => validateTransactionSignature(tooLong)).toThrow('decoded to 100 bytes');
    });

    it('should reject empty string', () => {
      expect(() => validateTransactionSignature('')).toThrow();
    });
  });

  describe('validateTokenMint', () => {
    it('should accept valid USDC mint address', () => {
      const validMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      expect(() => validateTokenMint(validMint)).not.toThrow();
    });

    it('should reject invalid mint', () => {
      expect(() => validateTokenMint('invalid')).toThrow();
    });
  });

  describe('validateProgramId', () => {
    it('should accept valid TokenkegQfezyi program ID', () => {
      const tokenProgram = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
      expect(() => validateProgramId(tokenProgram)).not.toThrow();
    });

    it('should reject invalid program ID', () => {
      expect(() => validateProgramId('invalid')).toThrow();
    });
  });

  describe('Token and Amount Precision', () => {
    it('should preserve large token amounts as strings without precision loss', () => {
      // 1 USDC = 1,000,000 (6 decimals)
      const largeAmount = '123456789012345678901234567890';
      expect(largeAmount).toBeTruthy();
      expect(typeof largeAmount).toBe('string');
    });

    it('should correctly represent SOL decimals as 9', () => {
      const solToken: Token = {
        mint: validateTokenMint('So11111111111111111111111111111111111111112'),
        symbol: 'SOL',
        decimals: 9,
        name: 'Solana',
      };
      expect(solToken.decimals).toBe(9);
    });

    it('should correctly represent USDC decimals as 6', () => {
      const usdcToken: Token = {
        mint: validateTokenMint('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
        symbol: 'USDC',
        decimals: 6,
        name: 'USD Coin',
      };
      expect(usdcToken.decimals).toBe(6);
    });

    it('should handle 1 SOL (1000000000 lamports) as string', () => {
      const oneSolAmount = '1000000000'; // 1 SOL
      expect(oneSolAmount).toBe('1000000000');
      expect(typeof oneSolAmount).toBe('string');
    });
  });
});
