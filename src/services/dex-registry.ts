/**
 * DEX Protocol Registry and Adapters
 * Configurable, verified protocol definitions
 * NEVER invents or guesses program IDs
 */

import { ProgramId } from '../types/domain';

/**
 * Decoder interface for swap instructions
 */
export interface SwapDecoderInterface {
  canDecode(instructionData: Buffer): boolean;
  decode(instructionData: Buffer, accounts: string[]): SwapDecodingResult | null;
}

/**
 * Result of swap decoding attempt
 */
export interface SwapDecodingResult {
  status: 'confirmed' | 'candidate' | 'unknown';
  inputMint: string | null; // Token being sold
  outputMint: string | null; // Token being bought
  inputAmount: string | null; // Raw amount
  outputAmount: string | null; // Raw amount
  confidence: 'high' | 'medium' | 'low';
}

/**
 * DEX Protocol Adapter
 */
export interface DexProtocolAdapter {
  programId: ProgramId;
  programName: string;
  supportedInstructions: Set<string>;
  decoder: SwapDecoderInterface;
}

/**
 * DEX Registry - holds verified protocol adapters
 * Only uses verified program IDs from official sources
 */
export class DexRegistry {
  private adapters: Map<string, DexProtocolAdapter> = new Map();

  /**
   * Register a DEX protocol adapter
   * CRITICAL: Only register adapters with verified program IDs
   */
  registerAdapter(adapter: DexProtocolAdapter): void {
    this.adapters.set(adapter.programId, adapter);
  }

  /**
   * Get adapter for program ID
   */
  getAdapter(programId: string): DexProtocolAdapter | undefined {
    return this.adapters.get(programId);
  }

  /**
   * Check if program is known DEX
   */
  isKnownDex(programId: string): boolean {
    return this.adapters.has(programId);
  }

  /**
   * Get all known DEX program IDs
   */
  getKnownProgramIds(): string[] {
    return Array.from(this.adapters.keys());
  }
}

/**
 * Placeholder decoder for unknown protocols
 * Returns status = 'unknown' and no decoded data
 */
export class UnknownProtocolDecoder implements SwapDecoderInterface {
  canDecode(_instructionData: Buffer): boolean {
    // Cannot decode unknown protocols
    return false;
  }

  decode(_instructionData: Buffer, _accounts: string[]): SwapDecodingResult | null {
    return null;
  }
}

/**
 * Placeholder decoder for Raydium (example)
 * This is a stub - real implementation requires actual Raydium instruction parsing
 * DO NOT use this without proper Raydium documentation verification
 */
export class RaydiumSwapDecoder implements SwapDecoderInterface {
  canDecode(instructionData: Buffer): boolean {
    // Raydium swap instruction starts with specific discriminator
    // This is a placeholder - real implementation requires verification
    if (instructionData.length < 8) return false;
    // Real implementation would check actual instruction discriminator
    return false; // Placeholder: cannot decode yet
  }

  decode(_instructionData: Buffer, _accounts: string[]): SwapDecodingResult | null {
    // Placeholder - would decode actual Raydium swap instruction
    return null;
  }
}

/**
 * Placeholder decoder for Jupiter (example)
 * This is a stub - real implementation requires actual Jupiter instruction parsing
 */
export class JupiterSwapDecoder implements SwapDecoderInterface {
  canDecode(instructionData: Buffer): boolean {
    // Jupiter swap instruction parsing stub
    if (instructionData.length < 8) return false;
    return false; // Placeholder: cannot decode yet
  }

  decode(_instructionData: Buffer, _accounts: string[]): SwapDecodingResult | null {
    // Placeholder - would decode actual Jupiter swap instruction
    return null;
  }
}
