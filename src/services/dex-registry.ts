/**
 * DEX Protocol Registry and Adapters
 * Configurable, verified protocol definitions
 * NEVER invents or guesses program IDs
 */

import { createHash } from 'crypto';
import { ProgramId, validateProgramId } from '../types/domain';

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
 * Raydium AMM V4 program ID - 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8.
 * Verified against Raydium's own docs (docs.raydium.io/reference/program-addresses)
 * and the raydium-io/raydium-amm GitHub repository.
 */
export const RAYDIUM_AMM_V4_PROGRAM_ID = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8';

// AmmInstruction enum discriminators (first byte of instruction data) from
// raydium-io/raydium-amm's program/src/instruction.rs: SwapInstructionBaseIn
// is enum variant 9, SwapInstructionBaseOut is variant 11.
const RAYDIUM_SWAP_BASE_IN_DISCRIMINATOR = 9;
const RAYDIUM_SWAP_BASE_OUT_DISCRIMINATOR = 11;

/**
 * Raydium AMM V4 swap decoder.
 *
 * Verified: the instruction *type* (swap vs. not) via the discriminator
 * byte above.
 * NOT verified: the exact account-list position of the input/output token
 * accounts for this instruction (that depends on pool layout details this
 * codebase hasn't independently confirmed against Raydium's source) - so
 * inputMint/outputMint/amounts are intentionally left `null` rather than
 * guessed. This is instruction-type identification, not a full decode;
 * status is 'candidate', never 'confirmed', for that reason.
 */
export class RaydiumSwapDecoder implements SwapDecoderInterface {
  canDecode(instructionData: Buffer): boolean {
    if (instructionData.length < 1) return false;
    const discriminator = instructionData[0];
    return discriminator === RAYDIUM_SWAP_BASE_IN_DISCRIMINATOR || discriminator === RAYDIUM_SWAP_BASE_OUT_DISCRIMINATOR;
  }

  decode(instructionData: Buffer, _accounts: string[]): SwapDecodingResult | null {
    if (!this.canDecode(instructionData)) return null;

    return {
      status: 'candidate',
      inputMint: null,
      outputMint: null,
      inputAmount: null,
      outputAmount: null,
      confidence: 'medium',
    };
  }
}

/**
 * Jupiter Aggregator V6 program ID - JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4.
 * Verified against Jupiter's own instruction parser (jup-ag/instruction-parser
 * on GitHub) and multiple independent block explorers (Solscan, SolanaFM).
 */
export const JUPITER_V6_PROGRAM_ID = 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4';

/**
 * Computes an Anchor "global" instruction discriminator: the first 8 bytes
 * of sha256("global:<instruction_name>"). This is Anchor's standard,
 * documented scheme - computed here rather than hardcoded as literal bytes,
 * so correctness only depends on the instruction name string, not on
 * transcribing a hex constant.
 */
function anchorDiscriminator(instructionName: string): Buffer {
  return createHash('sha256').update(`global:${instructionName}`).digest().subarray(0, 8);
}

// Jupiter v6's swap-family instructions, per jup-ag/instruction-parser.
// Anchor discriminators hash the Rust function name (snake_case); the IDL
// exposes camelCase names to JS/TS clients. Both spellings are included for
// the multi-word names since which one is authoritative wasn't
// independently confirmed here - an unmatched guess just fails to match
// (falls back to 'unknown'), it can never cause a false positive, since a
// SHA-256 preimage collision with an unrelated instruction is not a
// realistic risk.
const JUPITER_SWAP_INSTRUCTION_NAMES = [
  'route',
  'sharedAccountsRoute',
  'shared_accounts_route',
  'exactOutRoute',
  'exact_out_route',
  'routeWithTokenLedger',
  'route_with_token_ledger',
];
const JUPITER_SWAP_DISCRIMINATORS = JUPITER_SWAP_INSTRUCTION_NAMES.map(anchorDiscriminator);

/**
 * Jupiter Aggregator V6 swap decoder.
 * Same verified-type/unverified-layout distinction as RaydiumSwapDecoder
 * above - see its comment for why status stops at 'candidate'.
 */
export class JupiterSwapDecoder implements SwapDecoderInterface {
  canDecode(instructionData: Buffer): boolean {
    if (instructionData.length < 8) return false;
    const prefix = instructionData.subarray(0, 8);
    return JUPITER_SWAP_DISCRIMINATORS.some((discriminator) => discriminator.equals(prefix));
  }

  decode(instructionData: Buffer, _accounts: string[]): SwapDecodingResult | null {
    if (!this.canDecode(instructionData)) return null;

    return {
      status: 'candidate',
      inputMint: null,
      outputMint: null,
      inputAmount: null,
      outputAmount: null,
      confidence: 'medium',
    };
  }
}

/**
 * Builds a DexRegistry with Raydium AMM V4 and Jupiter V6 registered under
 * their verified program IDs. This is the registry `main.ts` and
 * `src/mcp/server.ts` actually use - a bare `new DexRegistry()` has nothing
 * registered.
 */
export function createDefaultDexRegistry(): DexRegistry {
  const registry = new DexRegistry();

  registry.registerAdapter({
    programId: validateProgramId(RAYDIUM_AMM_V4_PROGRAM_ID),
    programName: 'Raydium',
    supportedInstructions: new Set(['swapBaseIn', 'swapBaseOut']),
    decoder: new RaydiumSwapDecoder(),
  });

  registry.registerAdapter({
    programId: validateProgramId(JUPITER_V6_PROGRAM_ID),
    programName: 'Jupiter',
    supportedInstructions: new Set(JUPITER_SWAP_INSTRUCTION_NAMES),
    decoder: new JupiterSwapDecoder(),
  });

  return registry;
}
