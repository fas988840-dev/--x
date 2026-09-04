import { createHash } from 'crypto';
import { describe, it, expect } from 'vitest';
import {
  DexRegistry,
  RaydiumSwapDecoder,
  JupiterSwapDecoder,
  createDefaultDexRegistry,
  RAYDIUM_AMM_V4_PROGRAM_ID,
  JUPITER_V6_PROGRAM_ID,
  ORCA_WHIRLPOOLS_PROGRAM_ID,
} from './dex-registry.js';

function anchorDiscriminator(name: string): Buffer {
  return createHash('sha256').update(`global:${name}`).digest().subarray(0, 8);
}

describe('RaydiumSwapDecoder', () => {
  const decoder = new RaydiumSwapDecoder();

  it('recognizes the SwapBaseIn discriminator without inventing amounts', () => {
    const data = Buffer.from([9, 0, 0, 0, 0, 0, 0, 0]);
    expect(decoder.canDecode(data)).toBe(true);
    const result = decoder.decode(data, []);
    expect(result?.status).toBe('candidate');
    expect(result?.inputAmount).toBeNull();
    expect(result?.outputAmount).toBeNull();
    expect(result?.inputMint).toBeNull();
    expect(result?.outputMint).toBeNull();
  });

  it('recognizes the SwapBaseOut discriminator', () => {
    expect(decoder.canDecode(Buffer.from([11, 1, 2, 3]))).toBe(true);
  });

  it('does not match unrelated or empty data', () => {
    expect(decoder.canDecode(Buffer.from([0, 1, 2, 3]))).toBe(false);
    expect(decoder.decode(Buffer.from([0, 1, 2, 3]), [])).toBeNull();
    expect(decoder.canDecode(Buffer.alloc(0))).toBe(false);
  });
});

describe('JupiterSwapDecoder', () => {
  const decoder = new JupiterSwapDecoder();

  it('recognizes the computed Anchor discriminator for route', () => {
    const data = Buffer.concat([anchorDiscriminator('route'), Buffer.from([1, 2, 3])]);
    expect(decoder.canDecode(data)).toBe(true);
    const result = decoder.decode(data, []);
    expect(result?.status).toBe('candidate');
    expect(result?.inputAmount).toBeNull();
  });

  it('fails safe for random/short data', () => {
    expect(decoder.canDecode(Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]))).toBe(false);
    expect(decoder.canDecode(Buffer.from([1, 2, 3]))).toBe(false);
  });
});

describe('createDefaultDexRegistry', () => {
  it('registers verified Raydium, Jupiter and Orca program identities', () => {
    const registry = createDefaultDexRegistry();

    expect(registry.isKnownDex(RAYDIUM_AMM_V4_PROGRAM_ID)).toBe(true);
    expect(registry.isKnownDex(JUPITER_V6_PROGRAM_ID)).toBe(true);
    expect(registry.isKnownDex(ORCA_WHIRLPOOLS_PROGRAM_ID)).toBe(true);
    expect(registry.getKnownProgramIds().sort()).toEqual(
      [JUPITER_V6_PROGRAM_ID, ORCA_WHIRLPOOLS_PROGRAM_ID, RAYDIUM_AMM_V4_PROGRAM_ID].sort()
    );

    expect(registry.getAdapter(RAYDIUM_AMM_V4_PROGRAM_ID)?.programName).toBe('Raydium');
    expect(registry.getAdapter(JUPITER_V6_PROGRAM_ID)?.programName).toBe('Jupiter');
    expect(registry.getAdapter(ORCA_WHIRLPOOLS_PROGRAM_ID)?.programName).toBe('Orca Whirlpools');
  });

  it('keeps Orca instructions UNKNOWN until its layout decoder is verified', () => {
    const orca = createDefaultDexRegistry().getAdapter(ORCA_WHIRLPOOLS_PROGRAM_ID);
    expect(orca?.decoder.canDecode(Buffer.from([1, 2, 3]))).toBe(false);
    expect(orca?.decoder.decode(Buffer.from([1, 2, 3]), [])).toBeNull();
  });

  it('a plain registry has nothing registered', () => {
    const registry = new DexRegistry();
    expect(registry.getKnownProgramIds()).toEqual([]);
  });
});
