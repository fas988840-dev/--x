/**
 * DEX Protocol Registry and Adapters
 * Configurable, verified protocol definitions
 * NEVER invents or guesses program IDs
 */

import { createHash } from 'crypto';
import { ProgramId, validateProgramId } from '../types/domain.js';

export interface SwapDecoderInterface {
  canDecode(instructionData: Buffer): boolean;
  decode(instructionData: Buffer, accounts: string[]): SwapDecodingResult | null;
}

export interface SwapDecodingResult {
  status: 'confirmed' | 'candidate' | 'unknown';
  inputMint: string | null;
  outputMint: string | null;
  inputAmount: string | null;
  outputAmount: string | null;
  confidence: 'high' | 'medium' | 'low';
}

export interface DexProtocolAdapter {
  programId: ProgramId;
  programName: string;
  supportedInstructions: Set<string>;
  decoder: SwapDecoderInterface;
}

export class DexRegistry {
  private adapters: Map<string, DexProtocolAdapter> = new Map();

  registerAdapter(adapter: DexProtocolAdapter): void {
    this.adapters.set(adapter.programId, adapter);
  }

  getAdapter(programId: string): DexProtocolAdapter | undefined {
    return this.adapters.get(programId);
  }

  isKnownDex(programId: string): boolean {
    return this.adapters.has(programId);
  }

  getKnownProgramIds(): string[] {
    return Array.from(this.adapters.keys());
  }
}

/**
 * Decoder used when a protocol program ID is verified but FactLedger has not
 * independently verified the instruction/account layout. Registering the
 * program identity does not promote any instruction to candidate/confirmed.
 */
export class UnknownProtocolDecoder implements SwapDecoderInterface {
  canDecode(_instructionData: Buffer): boolean {
    return false;
  }

  decode(_instructionData: Buffer, _accounts: string[]): SwapDecodingResult | null {
    return null;
  }
}

export const RAYDIUM_AMM_V4_PROGRAM_ID = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8';
const RAYDIUM_SWAP_BASE_IN_DISCRIMINATOR = 9;
const RAYDIUM_SWAP_BASE_OUT_DISCRIMINATOR = 11;

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

export const JUPITER_V6_PROGRAM_ID = 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4';

/**
 * Orca Whirlpools program identity, verified against the official
 * orca-so/whirlpools repository Anchor.toml.
 *
 * The program is registered so transactions can identify the protocol name,
 * but its instruction/account layout is intentionally NOT decoded here yet.
 * Until that layout is independently verified against the current Orca SDK,
 * instructions from this program remain status=unknown with decoded=null.
 */
export const ORCA_WHIRLPOOLS_PROGRAM_ID = 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc';

function anchorDiscriminator(instructionName: string): Buffer {
  return createHash('sha256').update(`global:${instructionName}`).digest().subarray(0, 8);
}

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

  registry.registerAdapter({
    programId: validateProgramId(ORCA_WHIRLPOOLS_PROGRAM_ID),
    programName: 'Orca Whirlpools',
    supportedInstructions: new Set(),
    decoder: new UnknownProtocolDecoder(),
  });

  return registry;
}
