import { describe, it, expect } from 'vitest';
import {
  validateWalletAddress,
  validateTransactionSignature,
  validateTokenMint,
  validateProgramId,
  ValidationError,
} from '../types/domain';

describe('Domain Validation', () => {
  describe('validateWalletAddress', () => {
    it('should accept valid wallet address', () => {
      const validAddr = '11111111111111111111111111111112'; // System program
      expect(() => validateWalletAddress(validAddr)).not.toThrow();
    });

    it('should accept valid Solana address (44 chars)', () => {
      const validAddr = 'EPjFWaLb3odccccfFFd82hhSSUmUjKP6MtoxQTxxuQ';
      expect(() => validateWalletAddress(validAddr)).not.toThrow();
    });

    it('should reject invalid address - too short', () => {
      expect(() => validateWalletAddress('123')).toThrow();
    });

    it('should reject invalid address - invalid characters', () => {
      expect(() => validateWalletAddress('InvalidAddressWithBadChars000000000000000')).toThrow();
    });

    it('should reject empty string', () => {
      expect(() => validateWalletAddress('')).toThrow();
    });
  });

  describe('validateTransactionSignature', () => {
    it('should accept valid 88-character base58 signature', () => {
      const validSig =
        '4MkLRHFdBJnPhKMVPy8gWXVwP8eA2CUyHhXmw3HzHrxP7a8H9LJ3JHcLhJPJ9Z2L3GJ6BL7Q5KJ9P2B3L6M5N8Z';
      expect(() => validateTransactionSignature(validSig)).not.toThrow();
    });

    it('should reject invalid base58 characters', () => {
      // Contains 'O' which is not valid base58
      const invalidSig =
        '4MkLRHFdBJnPhKMVPy8gWXVwP8eA2CUyHhXmw3HzHrxP7a8H9LJ3JHcLhJPJ9Z2L3GJ6BL7Q5KJ9P2B3L6M5NO';
      expect(() => validateTransactionSignature(invalidSig)).toThrow();
    });

    it('should reject signature that is too short', () => {
      expect(() => validateTransactionSignature('123')).toThrow();
    });

    it('should reject signature that is too long', () => {
      const tooLong = '1'.repeat(100);
      expect(() => validateTransactionSignature(tooLong)).toThrow();
    });

    it('should reject empty string', () => {
      expect(() => validateTransactionSignature('')).toThrow();
    });
  });

  describe('validateTokenMint', () => {
    it('should accept valid mint address', () => {
      const validMint = 'EPjFWaLb3odccccfFFd82hhSSUmUjKP6MtoxQTxxuQ'; // USDC
      expect(() => validateTokenMint(validMint)).not.toThrow();
    });

    it('should reject invalid mint', () => {
      expect(() => validateTokenMint('invalid')).toThrow();
    });
  });

  describe('validateProgramId', () => {
    it('should accept valid program ID', () => {
      const tokenProgram = 'TokenkegQfeZyiNwAJsyFbPVwwQQfuM32jneSYOAxU';
      expect(() => validateProgramId(tokenProgram)).not.toThrow();
    });

    it('should reject invalid program ID', () => {
      expect(() => validateProgramId('invalid')).toThrow();
    });
  });
});
