import { createHash } from 'crypto';
import { describe, it, expect } from 'vitest';
import {
  DexRegistry,
  RaydiumSwapDecoder,
  JupiterSwapDecoder,
  createDefaultDexRegistry,
  RAYDIUM_AMM_V4_PROGRAM_ID,
  JUPITER_V6_PROGRAM_ID,
} from './dex-registry';

function anchorDiscriminator(name: string): Buffer {
  return createHash('sha256').update(`global:${name}`).digest().subarray(0, 8);
}

describe('RaydiumSwapDecoder', () => {
  const decoder = new RaydiumSwapDecoder();

  it('recognizes the SwapBaseIn discriminator (9) as a swap instruction, without inventing amounts', () => {
    const data = Buffer.from([9, 0, 0, 0, 0, 0, 0, 0]);
    expect(decoder.canDecode(data)).toBe(true);

    const result = decoder.decode(data, []);
    expect(result?.status).toBe('candidate');
    expect(result?.inputAmount).toBeNull();
    expect(result?.outputAmount).toBeNull();
    expect(result?.inputMint).toBeNull();
    expect(result?.outputMint).toBeNull();
  });

  it('recognizes the SwapBaseOut discriminator (11)', () => {
    expect(decoder.canDecode(Buffer.from([11, 1, 2, 3]))).toBe(true);
  });

  it('does not match an unrelated discriminator', () => {
    expect(decoder.canDecode(Buffer.from([0, 1, 2, 3]))).toBe(false);
    expect(decoder.decode(Buffer.from([0, 1, 2, 3]), [])).toBeNull();
  });

  it('does not match empty data', () => {
    expect(decoder.canDecode(Buffer.alloc(0))).toBe(false);
  });
});

describe('JupiterSwapDecoder', () => {
  const decoder = new JupiterSwapDecoder();

  it('recognizes the computed Anchor discriminator for the "route" instruction', () => {
    const discriminator = anchorDiscriminator('route');
    const data = Buffer.concat([discriminator, Buffer.from([1, 2, 3])]);

    expect(decoder.canDecode(data)).toBe(true);
    const result = decoder.decode(data, []);
    expect(result?.status).toBe('candidate');
    expect(result?.inputAmount).toBeNull();
  });

  it('does not match random 8-byte data (fails safe, never a false positive by guessing)', () => {
    const randomData = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(decoder.canDecode(randomData)).toBe(false);
    expect(decoder.decode(randomData, [])).toBeNull();
  });

  it('does not match data shorter than 8 bytes', () => {
    expect(decoder.canDecode(Buffer.from([1, 2, 3]))).toBe(false);
  });
});

describe('createDefaultDexRegistry', () => {
  it('registers Raydium and Jupiter under their verified program IDs', () => {
    const registry = createDefaultDexRegistry();

    expect(registry.isKnownDex(RAYDIUM_AMM_V4_PROGRAM_ID)).toBe(true);
    expect(registry.isKnownDex(JUPITER_V6_PROGRAM_ID)).toBe(true);
    expect(registry.getKnownProgramIds().sort()).toEqual([JUPITER_V6_PROGRAM_ID, RAYDIUM_AMM_V4_PROGRAM_ID].sort());

    const raydiumAdapter = registry.getAdapter(RAYDIUM_AMM_V4_PROGRAM_ID);
    expect(raydiumAdapter?.programName).toBe('Raydium');

    const jupiterAdapter = registry.getAdapter(JUPITER_V6_PROGRAM_ID);
    expect(jupiterAdapter?.programName).toBe('Jupiter');
  });

  it('a plain `new DexRegistry()` (used elsewhere, e.g. tests) has nothing registered', () => {
    const registry = new DexRegistry();
    expect(registry.getKnownProgramIds()).toEqual([]);
  });
});
