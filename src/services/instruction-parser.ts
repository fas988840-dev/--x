/**
 * Instruction Parser
 * Parses transaction instructions and identifies programs
 * CRITICAL: Never fabricates data. Returns 'unknown' or 'candidate' when unsure.
 */

import { ParsedInstruction, Instruction, ProgramId } from '../types/domain';
import { DexRegistry, SwapDecodingResult } from './dex-registry';

/**
 * Instruction Parser Service
 */
export class InstructionParser {
  constructor(private dexRegistry: DexRegistry) {}

  /**
   * Parse a single instruction
   */
  parseInstruction(instruction: Instruction): ParsedInstruction {
    const programId = instruction.programId;

    // Check if known DEX
    const dexAdapter = this.dexRegistry.getAdapter(programId);

    if (!dexAdapter) {
      // Unknown program
      return {
        programId,
        programName: 'Unknown',
        instructionType: 'Unknown',
        status: 'unknown',
        decoded: null,
        raw: instruction,
      };
    }

    // Known DEX - attempt to decode instruction
    const decodingResult = dexAdapter.decoder.decode(instruction.data, instruction.accounts.map((a) => a.pubkey));

    if (!decodingResult) {
      // Could not decode instruction
      return {
        programId,
        programName: dexAdapter.programName,
        instructionType: 'Unknown',
        status: 'unknown',
        decoded: null,
        raw: instruction,
      };
    }

    // Return parsed instruction with decoding result
    return {
      programId,
      programName: dexAdapter.programName,
      instructionType: 'Swap', // Would be determined by decoder
      status: decodingResult.status,
      decoded: decodingResult,
      raw: instruction,
    };
  }

  /**
   * Parse all instructions from a transaction
   */
  parseInstructions(instructions: Instruction[]): ParsedInstruction[] {
    return instructions.map((ix) => this.parseInstruction(ix));
  }

  /**
   * Check if instruction is a swap candidate
   * Candidate = unknown program that might be a DEX
   * Confirmed = known DEX adapter confirmed it's a swap
   */
  isSwapCandidate(parsed: ParsedInstruction): boolean {
    // Status can be 'confirmed', 'candidate', or 'unknown'
    return parsed.status === 'candidate';
  }

  /**
   * Check if instruction is a confirmed swap
   */
  isConfirmedSwap(parsed: ParsedInstruction): boolean {
    return parsed.status === 'confirmed';
  }
}
